window.addEventListener('DOMContentLoaded', () => {

    // 1. Dictionnaire principal de ciblage (Correction des ID pour correspondre aux SVG réels)
    const COLOR_MAPPING = {
        'skin-color': [
            { layerId: 'layer-tete', targetIds: ['FILL-PEAU-VISAGE-ANGULAIRE', 'VISAGE-ANGULAIRE', 'VISAGE-ARRONDIS', 'TETE'] },
            { layerId: 'layer-cou', targetIds: ['FILL-PEAU-COU-ANGULAIRE', 'COU', 'COU-ANGULAIRE', 'FORME-COU'] },
            { layerId: 'layer-oreilles', targetIds: ['FILL-PEAU-OREILLE-DROITE', 'FILL-PEAU-OREILLE-GAUCHE', 'OREILLE-DROITE-ANGULAIRE', 'OREILLE-GAUCHE-ANGULAIRE', 'OREILLE-DROITE', 'OREILLE-GAUCHE'] },
            { layerId: 'layer-menton', targetIds: ['MENTON-ANGULAIRE'] }
        ],
        'shadow-color': [
            {
                layerId: 'layer-ombres', targetIds: [
                    'FILL-OMBRE-COU-ANGULAIRE', 'FILL-OMBRE-BOUCHE',
                    'FILL-OMBRE-BAS-ANGULAIRE-GAUCHE', 'FILL-OMBRE-BAS-ANGULAIRE-DROIT',
                    'FILL-OMBRE-TEMPES-DROIT', 'FILL-OMBRE-TEMPES-GAUCHE',
                    'OMBRE-COU-ANGULAIRE', 'OMBRE-BOUCHE', 'OMBRE-BAS-ANGULAIRE-GAUCHE',
                    'OMBRE-BAS-ANGULAIRE-DROIT', 'OMBRE-TEMPES-DROIT', 'OMBRE-TEMPES-GAUCHE'
                ]
            }
        ],
        'hair-top-color': [
            // CORRECTION ICI : Ajout des vrais IDs présents dans le fichier SVG en plus des potentiels préfixes FILL-
            { layerId: 'layer-cheveux', targetIds: ['FILL-CHEVEUX-TOP', 'CHEVEUX-TOP', 'CHEVEUX-TOP-ANGULAIRE', 'CHEVEUX-ARRONDIS'] }
        ],
        'eyebrows-color': [
            { layerId: 'layer-sourcils', targetIds: ['SOURCIL-DROIT', 'SOURCIL-GAUCHE'] }
        ],
        'hair-sides-color': [
            { layerId: 'layer-cheveux', targetIds: ['FILL-CHEVEUX-TEMPE-DROIT', 'FILL-CHEVEUX-TEMPE-GAUCHE', 'CHEVEUX-TEMPE-DROIT', 'CHEVEUX-TEMPE-GAUCHE'] }
        ],
        'eyes-color': [
            {
                layerId: 'layer-yeux', targetIds: [
                    'YEUX-01-FILL-IRIS-DROIT', 'YEUX-01-FILL-IRIS-GAUCHE',
                    'YEUX-02-FILL-IRIS-DROIT', 'YEUX-02-FILL-IRIS-GAUCHE',
                    'YEUX-03-FILL-IRIS-DROIT', 'YEUX-03-FILL-IRIS-GAUCHE',
                    'FILL-IRIS-DROIT-YEUX-ARRONDIS', 'FILL-IRIS-GAUCHE-YEUX-ARRONDIS',
                    'IRIS-GAUCHE', 'IRIS-DROIT', 'IRIS-GAUCHE-ANGULAIRE', 'IRIS-DROITE-ANGULAIRE'
                ]
            }
        ]
    };

    // 2. PARE-FEU INVIOLABLE POUR LES CONTOURS NOIRS
    // Aucun de ces IDs ne pourra jamais recevoir de couleur, quoi qu'il arrive.
    const BLACKLIST_IDS = [
        'creux-joue-droit',
        'creux-joue-gauche',
        'creux-joue-gauch',
        'cerne-cheveux',
        'cheveux-top-cerne',
        'cerne-bouche'
    ];

    // Vérifie si l'ID doit être explicitement sanctuarisé (protégé)
    function isProtectedTrace(id) {
        if (!id) return false;
        const normalized = id.trim().toLowerCase();
        // Protège tout ce qui commence par "trace-" OU tout élément de la blacklist
        if (normalized.startsWith('trace-')) return true;
        return BLACKLIST_IDS.some(blackId =>
            normalized === blackId ||
            normalized.startsWith(`${blackId}-`) ||
            normalized.startsWith(`${blackId}_`)
        );
    }

    const shadowOpacityInput = document.getElementById('shadow-opacity-range');

    function updateSvgElements(layerId, targetIds, config) {
        const objElement = document.getElementById(layerId);
        if (!objElement) return;

        const executeUpdate = () => {
            try {
                const svgDoc = objElement.contentDocument || (objElement.getSVGDocument ? objElement.getSVGDocument() : null);
                if (!svgDoc) return;

                targetIds.forEach(targetId => {
                    const searchId = targetId.toLowerCase();

                    svgDoc.querySelectorAll('*').forEach(el => {
                        const currentId = (el.getAttribute('id') || '').trim().toLowerCase();
                        if (!currentId) return;

                        // Si le calque entier (ex: un groupe <g id="trace-visage">) est protégé, on l'ignore.
                        if (isProtectedTrace(currentId)) return;

                        const isMatch = currentId === searchId ||
                            currentId.startsWith(`${searchId}-`) ||
                            currentId.startsWith(`${searchId}_`);

                        if (isMatch) {
                            const applyStyles = (element, isChild = false) => {
                                const elemId = (element.getAttribute('id') || '').trim().toLowerCase();

                                // SECURITÉ : Bloque toute injection de couleur sur les sous-tracés
                                if (isProtectedTrace(elemId)) return;

                                if (config.color) {
                                    if (elemId.includes('sourcil')) {
                                        element.style.setProperty('stroke', config.color, 'important');
                                        element.setAttribute('stroke', config.color);
                                    } else {
                                        element.style.setProperty('fill', config.color, 'important');
                                        element.setAttribute('fill', config.color);
                                    }
                                }

                                if (config.opacity !== undefined && !isChild) {
                                    element.style.setProperty('opacity', config.opacity, 'important');
                                    element.setAttribute('opacity', config.opacity);
                                    element.style.removeProperty('fill-opacity');
                                    element.removeAttribute('fill-opacity');
                                }
                            };

                            // On applique au conteneur principal ciblé
                            applyStyles(el);

                            // On traverse tous les enfants géométriques, tout en garantissant
                            // que isProtectedTrace protégera les éventuels tracés imbriqués sans ID explicite.
                            el.querySelectorAll('path, polygon, rect, circle, ellipse, polyline, line').forEach(child => {
                                applyStyles(child, true);
                            });
                        }
                    });
                });
            } catch (error) {
                console.error(`Erreur sur le calque ${layerId}:`, error);
            }
        };

        if (objElement.contentDocument && objElement.contentDocument.readyState === 'complete') {
            executeUpdate();
        } else {
            objElement.addEventListener('load', executeUpdate, { once: true });
        }
        setTimeout(executeUpdate, 100);
        setTimeout(executeUpdate, 400); // Sécurité asynchrone pour les navigateurs lents
    }

    function applyAllMappings() {
        Object.keys(COLOR_MAPPING).forEach(inputId => {
            if (inputId === 'eyebrows-color') return;

            const input = document.getElementById(inputId);
            if (!input) return;

            const colorValue = input.value;
            let opacityValue = undefined;

            if (inputId === 'shadow-color' && shadowOpacityInput) {
                opacityValue = shadowOpacityInput.value;
            }

            localStorage.setItem(inputId, colorValue);

            COLOR_MAPPING[inputId].forEach(mapping => {
                updateSvgElements(mapping.layerId, mapping.targetIds, {
                    color: colorValue,
                    opacity: opacityValue
                });
            });
        });

        if (shadowOpacityInput) {
            localStorage.setItem('shadow-opacity', shadowOpacityInput.value);
            const shadowColorInput = document.getElementById('shadow-color');
            COLOR_MAPPING['shadow-color'].forEach(mapping => {
                updateSvgElements(mapping.layerId, mapping.targetIds, {
                    color: shadowColorInput ? shadowColorInput.value : undefined,
                    opacity: shadowOpacityInput.value
                });
            });
        }
    }

    function applyEyebrowsColor() {
        const eyebrowsColorInput = document.getElementById('eyebrows-color');
        if (eyebrowsColorInput && eyebrowsColorInput.value) {
            localStorage.setItem('eyebrows-color', eyebrowsColorInput.value);
            COLOR_MAPPING['eyebrows-color'].forEach(mapping => {
                updateSvgElements(mapping.layerId, mapping.targetIds, { color: eyebrowsColorInput.value });
            });
        }
    }

    function restoreSavedValues() {
        Object.keys(COLOR_MAPPING).forEach(inputId => {
            const savedColor = localStorage.getItem(inputId);
            const input = document.getElementById(inputId);
            if (savedColor && input) {
                input.value = savedColor;
            }
        });

        if (shadowOpacityInput) {
            const savedOpacity = localStorage.getItem('shadow-opacity');
            if (savedOpacity) {
                shadowOpacityInput.value = savedOpacity;
            }
        }

        const savedEyeModel = localStorage.getItem('selected-eye-model');
        const layerYeux = document.getElementById('layer-yeux');
        if (savedEyeModel && layerYeux) {
            const radioToSelect = document.querySelector(`input[name="eyes-model"][value="${savedEyeModel}"]`);
            if (radioToSelect) radioToSelect.checked = true;
            layerYeux.setAttribute('data', savedEyeModel);
            layerYeux.type = 'image/svg+xml';
        }

        const savedEyebrowsModel = localStorage.getItem('selected-eyebrows-model');
        const layerSourcils = document.getElementById('layer-sourcils');
        if (savedEyebrowsModel && layerSourcils) {
            const radioToSelect = document.querySelector(`input[name="eyebrows-model"][value="${savedEyebrowsModel}"]`);
            if (radioToSelect) radioToSelect.checked = true;
            layerSourcils.setAttribute('data', savedEyebrowsModel);
            layerSourcils.type = 'image/svg+xml';
        }
    }

    restoreSavedValues();

    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));

            btn.classList.add('active');
            const targetTab = document.getElementById(btn.dataset.tab);
            if (targetTab) {
                targetTab.classList.add('active');
            }
        });
    });

    const eyesModelRadios = document.querySelectorAll('input[name="eyes-model"]');
    eyesModelRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            const layerYeux = document.getElementById('layer-yeux');
            const selectedFile = e.target.value;

            if (layerYeux) {
                localStorage.setItem('selected-eye-model', selectedFile);

                const applyColorAfterLoad = () => {
                    const eyesColorInput = document.getElementById('eyes-color');
                    if (eyesColorInput && eyesColorInput.value) {
                        COLOR_MAPPING['eyes-color'].forEach(mapping => {
                            updateSvgElements(mapping.layerId, mapping.targetIds, { color: eyesColorInput.value });
                        });
                    }
                };

                layerYeux.addEventListener('load', applyColorAfterLoad, { once: true });
                layerYeux.setAttribute('data', selectedFile);
                layerYeux.type = 'image/svg+xml';

                setTimeout(applyColorAfterLoad, 300);
            }
        });
    });

    const eyebrowsModelRadios = document.querySelectorAll('input[name="eyebrows-model"]');
    eyebrowsModelRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            const layerSourcils = document.getElementById('layer-sourcils');
            const selectedFile = e.target.value;

            if (layerSourcils) {
                localStorage.setItem('selected-eyebrows-model', selectedFile);

                const applyColorAfterLoad = () => {
                    applyEyebrowsColor();
                };

                layerSourcils.addEventListener('load', applyColorAfterLoad, { once: true });
                layerSourcils.setAttribute('data', selectedFile);
                layerSourcils.type = 'image/svg+xml';

                setTimeout(applyColorAfterLoad, 300);
            }
        });
    });

    const eyebrowsColorInput = document.getElementById('eyebrows-color');
    if (eyebrowsColorInput) {
        eyebrowsColorInput.addEventListener('input', () => {
            applyEyebrowsColor();
        });
    }

    const eyesColorInput = document.getElementById('eyes-color');
    if (eyesColorInput) {
        eyesColorInput.addEventListener('input', () => {
            localStorage.setItem('eyes-color', eyesColorInput.value);
            COLOR_MAPPING['eyes-color'].forEach(mapping => {
                updateSvgElements(mapping.layerId, mapping.targetIds, { color: eyesColorInput.value });
            });
        });
    }

    Object.keys(COLOR_MAPPING).forEach(inputId => {
        const input = document.getElementById(inputId);
        if (input && inputId !== 'eyes-color' && inputId !== 'eyebrows-color') {
            input.addEventListener('input', () => applyAllMappings());
        }
    });

    if (shadowOpacityInput) {
        shadowOpacityInput.addEventListener('input', () => applyAllMappings());
    }

    setTimeout(() => {
        applyAllMappings();
        applyEyebrowsColor();
    }, 200);

});

document.querySelectorAll('.btn-copier').forEach(button => {
    button.addEventListener('click', (e) => {
        const colorInput = e.target.previousElementSibling;
        if (colorInput && colorInput.type === 'color') {
            const couleur = colorInput.value;
            navigator.clipboard.writeText(couleur).then(() => {
                const texteOriginal = e.target.textContent;
                e.target.textContent = 'Copié !';
                setTimeout(() => {
                    e.target.textContent = texteOriginal;
                }, 1200);
            });
        }
    });
});
