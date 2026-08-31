/* MESSAGE POUR MOI-MÊME : 
   Problème : L'application des couleurs échoue car le SVG n'est pas garanti d'être prêt, ou bien un problème de structure SVG (masque) empêche le rendu.
   Correction : Remplacement du setTimeout par un Polling robuste pour assurer l'exécution, et ajout de console.log pour isoler définitivement si le blocage vient du JS ou de la structure du SVG dans Illustrator.
*/
/* MESSAGE POUR MOI-MÊME :
   Problème : Le calque du visage devenait noir car le mot-clé "hair" était contenu dans le mot "chaire" (c-hair-e). La fonction includes() écrasait la couleur de la peau par celle des cheveux (noire).
   Correction : Suppression des mots-clés anglais ("hair", "clothes") du COLOR_MAPPING pour éviter le conflit de chaîne de caractères.
*/
/* MESSAGE POUR MOI-MÊME :
   Problème : Il manquait une fonction pour exporter le travail finalisé.
   Correction : Ajout d'un système de sérialisation XML qui capture le DOM du SVG avec ses nouvelles couleurs et génère un fichier téléchargeable à la volée.
*/
/* MESSAGE POUR MOI-MÊME :
   Problème : Le fichier partait dans "Téléchargements" par défaut, impossible d'écrire silencieusement dans F:\_www\export à cause de la sécurité du navigateur.
   Correction : Intégration de l'API window.showSaveFilePicker() pour ouvrir la boîte de dialogue "Enregistrer sous" et laisser l'utilisateur pointer vers son dossier.
*/

window.addEventListener('DOMContentLoaded', () => {

    const COLOR_MAPPING = {
        'chaire-color': ['chaire', 'fond-chaire', 'peau', 'fond-chaire-homme', 'fond-chaire-femme', 'fond-chaire-garcon', 'fond-chaire-fille'],
        'hair-color': ['cheveux', 'fond-cheveux', 'cheveux-garcon', 'cheveux-fille'],
        'clothes-color': ['pull', 'vetement', 'fond-pull'],
        'collar-color': ['col']
    };

    function getSvgDocument(objectElement) {
        if (!objectElement) return null;
        try {
            if (objectElement.contentDocument && objectElement.contentDocument.readyState === 'complete') {
                return objectElement.contentDocument;
            }
            if (typeof objectElement.getSVGDocument === 'function') {
                return objectElement.getSVGDocument();
            }
        } catch (e) {
            console.error("Erreur d'accès au SVG (CORS/Sécurité locale) :", e);
        }
        return null;
    }

    const applyColorToTarget = (element, colorValue) => {
        if (element.style) {
            element.style.fill = colorValue;
        }
        element.setAttribute('fill', colorValue);
    };

    function applyAllColors() {
        const activeObject = document.querySelector('.persona-svg.active');
        if (!activeObject) return;

        const svgDoc = getSvgDocument(activeObject);
        if (!svgDoc) return;

        let modificationAppliquee = false;

        Object.entries(COLOR_MAPPING).forEach(([inputId, keywords]) => {
            const input = document.getElementById(inputId);
            if (!input) return;

            const colorValue = input.value;
            localStorage.setItem(inputId, colorValue);
            const searchKeywords = keywords.map(kw => kw.toLowerCase());

            svgDoc.querySelectorAll('*').forEach(el => {
                const currentId = (el.getAttribute('id') || '').trim().toLowerCase();
                const dataName = (el.getAttribute('data-name') || '').trim().toLowerCase();
                const currentClass = (el.getAttribute('class') || '').trim().toLowerCase();

                const matchFound = searchKeywords.some(kw =>
                    currentId.includes(kw) || dataName.includes(kw) || currentClass.includes(kw)
                );

                if (matchFound) {
                    modificationAppliquee = true;
                    applyColorToTarget(el, colorValue);

                    el.querySelectorAll('path, polygon, rect, circle, ellipse, polyline').forEach(child => {
                        applyColorToTarget(child, colorValue);
                    });
                }
            });
        });

        if (modificationAppliquee) {
            console.log("Succès : Les calques ont été trouvés et coloriés par le JavaScript.");
        } else {
            console.warn("Échec : Le JavaScript accède au SVG mais ne trouve aucun calque correspondant aux mots-clés.");
        }
    }

    function waitForSvgAndApply(objectElement, attempts = 0) {
        const doc = getSvgDocument(objectElement);
        if (doc && doc.querySelectorAll('*').length > 5) {
            applyAllColors();
        } else if (attempts < 20) {
            setTimeout(() => waitForSvgAndApply(objectElement, attempts + 1), 100);
        } else {
            console.error("Délai dépassé : Le SVG n'a pas pu être chargé correctement.");
        }
    }

    document.querySelectorAll('.persona-svg').forEach(objectElement => {
        objectElement.addEventListener('load', () => {
            if (objectElement.classList.contains('active')) {
                waitForSvgAndApply(objectElement);
            }
        });
    });

    Object.keys(COLOR_MAPPING).forEach(inputId => {
        const input = document.getElementById(inputId);
        if (!input) return;

        const handler = () => {
            localStorage.setItem(inputId, input.value);
            applyAllColors();
        };

        input.addEventListener('input', handler);
        input.addEventListener('change', handler);
    });

    const personaModelRadios = document.querySelectorAll('input[name="persona-model"]');
    personaModelRadios.forEach(radio => {
        radio.addEventListener('change', event => {
            const targetId = event.target.value;
            localStorage.setItem('selected-persona-id', targetId);

            document.querySelectorAll('.persona-svg').forEach(obj => {
                obj.style.display = 'none';
                obj.classList.remove('active');
            });

            const selectedObject = document.getElementById(targetId);
            if (!selectedObject) return;

            selectedObject.style.display = 'block';
            selectedObject.classList.add('active');

            waitForSvgAndApply(selectedObject);
        });
    });

    document.querySelectorAll('.btn-copier').forEach(button => {
        button.addEventListener('click', event => {
            const controlGroup = event.target.closest('.control-group');
            if (!controlGroup) return;

            const colorInput = controlGroup.querySelector('input[type="color"]');
            if (!colorInput) return;

            navigator.clipboard.writeText(colorInput.value).then(() => {
                const originalText = button.textContent;
                button.textContent = 'Copié !';
                setTimeout(() => { button.textContent = originalText; }, 1500);
            }).catch(() => { });
        });
    });

    // --- NOUVELLE FONCTION D'EXPORT SVG ---
    const btnExportSvg = document.getElementById('btn-export-svg');
    if (btnExportSvg) {
        btnExportSvg.addEventListener('click', async () => {
            const activeObject = document.querySelector('.persona-svg.active');
            if (!activeObject) return;

            const svgDoc = getSvgDocument(activeObject);
            if (!svgDoc) {
                console.error("Impossible d'accéder au document SVG pour l'export.");
                const originalText = btnExportSvg.textContent;
                btnExportSvg.textContent = 'Erreur lors de l\'exportation';
                setTimeout(() => { btnExportSvg.textContent = originalText; }, 3000);
                return;
            }

            const serializer = new XMLSerializer();
            let source = serializer.serializeToString(svgDoc.documentElement);

            if (!source.match(/^<svg[^>]+xmlns="http\:\/\/www\.w3\.org\/2000\/svg"/)) {
                source = source.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
            }

            const savedPersonaId = localStorage.getItem('selected-persona-id') || 'persona-homme';
            const nomFichier = `export-${savedPersonaId}.svg`;

            try {
                // Ouvre la boîte de dialogue Enregistrer sous
                const handle = await window.showSaveFilePicker({
                    suggestedName: nomFichier,
                    types: [{
                        description: 'Fichier SVG vectoriel',
                        accept: { 'image/svg+xml': ['.svg'] }
                    }]
                });

                // Écriture du fichier à l'emplacement choisi par l'utilisateur
                const writable = await handle.createWritable();
                await writable.write(source);
                await writable.close();

                // Retour visuel
                const originalText = btnExportSvg.textContent;
                btnExportSvg.textContent = 'Export sauvegardé dans ton dossier !';
                setTimeout(() => { btnExportSvg.textContent = originalText; }, 3000);

            } catch (error) {
                // L'utilisateur a annulé ou fermé la fenêtre
                if (error.name !== 'AbortError') {
                    console.error("Erreur de sauvegarde :", error);
                }
            }
        });
    }
    // --------------------------------------

    function restoreAndInit() {
        Object.keys(COLOR_MAPPING).forEach(inputId => {
            const input = document.getElementById(inputId);
            if (!input) return;
            const savedColor = localStorage.getItem(inputId);
            if (savedColor) input.value = savedColor;
        });

        const savedPersonaId = localStorage.getItem('selected-persona-id') || 'persona-homme';

        document.querySelectorAll('.persona-svg').forEach(obj => {
            obj.style.display = 'none';
            obj.classList.remove('active');
        });

        const activeObject = document.getElementById(savedPersonaId) || document.getElementById('persona-homme');
        if (activeObject) {
            activeObject.style.display = 'block';
            activeObject.classList.add('active');
        }

        const radioToSelect = document.querySelector(`input[name="persona-model"][value="${savedPersonaId}"]`);
        if (radioToSelect) {
            radioToSelect.checked = true;
        }

        if (activeObject) {
            waitForSvgAndApply(activeObject);
        }
    }

    restoreAndInit();

    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabBtns.forEach(button => {
        button.addEventListener('click', () => {
            tabBtns.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));

            button.classList.add('active');
            const targetTab = document.getElementById(button.dataset.tab);
            if (targetTab) {
                targetTab.classList.add('active');
            }
        });
    });

});