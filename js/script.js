window.addEventListener('DOMContentLoaded', () => {

    const COLOR_MAPPING = {
        'skin-color': [
            { layerId: 'layer-tete', targetIds: ['VISAGE-ANGULAIRE', 'VISAGE-ARRONDIS', 'tete'] },
            { layerId: 'layer-cou', targetIds: ['cou', 'FORME-COU'] },
            { layerId: 'layer-oreilles', targetIds: ['OREILLE-DROITE-ANGULAIRE', 'OREILLE-GAUCHE-ANGULAIRE', 'OREILLE-DROITE', 'OREILLE-GAUCHE'] }
        ],
        'shadow-color': [
            { layerId: 'layer-ombres', targetIds: ['OMBRE-COU-ANGULAIRE', 'OMBRE-BOUCHE', 'OMBRE-BAS-ANGULAIRE-GAUCHE', 'OMBRE-BAS-ANGULAIRE-DROIT', 'OMBRE-TEMPES-DROIT', 'OMBRE-TEMPES-GAUCHE'] }
        ],
        'hair-top-color': [
            { layerId: 'layer-cheveux', targetIds: ['CHEVEUX-TOP-ANGULAIRE', 'CHEVEUX-TOP', 'CHEVEUX-ARRONDIS'] }
        ],
        'eyebrows-color': [
            { layerId: 'layer-sourcils', targetIds: ['SOURCIL-DROIT', 'SOURCIL-GAUCHE'] }
        ],
        'hair-sides-color': [
            { layerId: 'layer-cheveux', targetIds: ['CHEVEUX-TEMPE-DROIT', 'CHEVEUX-TEMPE-GAUCHE'] }
        ],
        'eyes-color': [
            { layerId: 'layer-yeux', targetIds: ['IRIS-GAUCHE', 'IRIS-DROIT', 'IRIS-GAUCHE-ANGULAIRE', 'IRIS-DROITE-ANGULAIRE'] }
        ]
    };

    const shadowOpacityInput = document.getElementById('shadow-opacity-range');

    function updateSvgElements(layerId, targetIds, config) {
        const objElement = document.getElementById(layerId);
        if (!objElement) return;

        const executeUpdate = () => {
            try {
                const svgDoc = objElement.contentDocument || (objElement.getSVGDocument ? objElement.getSVGDocument() : null);
                if (!svgDoc) return;

                if (layerId === 'layer-ombres') {
                    svgDoc.querySelectorAll('path, polygon, rect, circle, ellipse, polyline, line').forEach(el => {
                        if (config.color) {
                            el.style.setProperty('fill', config.color, 'important');
                            el.setAttribute('fill', config.color);
                        }
                        if (config.opacity !== undefined) {
                            el.style.setProperty('opacity', config.opacity, 'important');
                            el.setAttribute('opacity', config.opacity);
                            el.style.removeProperty('fill-opacity');
                            el.removeAttribute('fill-opacity');
                        }
                    });
                    return;
                }

                targetIds.forEach(targetId => {
                    const searchId = targetId.toLowerCase();
                    svgDoc.querySelectorAll('*').forEach(el => {
                        const currentId = (el.getAttribute('id') || '').trim().toLowerCase();

                        // Sécurité stricte uniquement pour les cheveux, correspondance souple pour la peau et le reste
                        const isMatch = (layerId === 'layer-cheveux')
                            ? (currentId === searchId)
                            : (currentId === searchId || currentId.includes(searchId));

                        if (isMatch) {
                            if (config.color) {
                                el.style.setProperty('fill', config.color, 'important');
                                el.setAttribute('fill', config.color);
                            }
                            if (config.opacity !== undefined) {
                                el.style.setProperty('opacity', config.opacity, 'important');
                                el.setAttribute('opacity', config.opacity);
                            }
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
        setTimeout(executeUpdate, 400);
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