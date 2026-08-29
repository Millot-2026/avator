window.addEventListener('DOMContentLoaded', () => {

    const COLOR_MAPPING = {
        'skin-color': [
            { layerId: 'layer-tete', targetIds: ['VISAGE-ANGULAIRE', 'VISAGE-ARRONDIS', 'tete'] },
            { layerId: 'layer-cou', targetIds: ['cou', 'FORME-COU'] },
            { layerId: 'layer-oreilles', targetIds: ['OREILLE-DROITE-ANGULAIRE', 'OREILLE-GAUCHE-ANGULAIRE', 'OREILLE-DROITE', 'OREILLE-GAUCHE'] }
        ],
        'shadow-color': [
            { layerId: 'layer-menton', targetIds: ['OMBRE-BAS-ANGULAIR-DROIT', 'OMBRE-BAS-ANGULAIR-GAUCHE', 'MENTON-ARRONDIS'] },
            { layerId: 'layer-tempes', targetIds: ['OMBRE-TEMPE-DROITE-ANGULAIRE', 'OMBRE-TEMPE-GAUCHE-ANGULAIRE', 'OMBRE-CREU-JOUE-DROITE-ANGULAIRE', 'OMBRE-CREU-JOUE-GAUCHE-ANGULAIRE', 'TEMPES-GAUCHE', 'TEMPES-DROIT', 'OMBRE-BOUCHE', 'OMBRE-COU'] },
            { layerId: 'layer-cou', targetIds: ['ombre-cou-angulaire'] }
        ],
        'hair-top-color': [
            { layerId: 'layer-cheveux', targetIds: ['CHEVEUX-TOP-ANGULAIRE', 'CHEVEUX-TOP', 'CHEVEUX-ARRONDIS'] }
        ],
        'eyebrows-color': [
            { layerId: 'layer-sourcils', targetIds: ['SOURCIL-DROIT', 'SOURCIL-GAUCHE'] }
        ],
        'hair-sides-color': [
            { layerId: 'layer-cheveux', targetIds: ['CHEVEUX-BAS-DROITE-ANGULAIRE', 'CHEVEUX-BAS-GAUCHE-ANGULAIRE', 'CERNE-CHEVEUX-ANGULAIRE', 'CHEVEUX-TEMPE-DROIT', 'CHEVEUX-TEMPE-GAUCHE', 'CHEVEUX-TOP-CERNE'] }
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

                targetIds.forEach(targetId => {
                    const searchId = targetId.toLowerCase();
                    const allElements = svgDoc.querySelectorAll('*');

                    allElements.forEach(el => {
                        const currentId = (el.getAttribute('id') || '').trim().toLowerCase();
                        const isAllowedMatch = (currentId === searchId || currentId.includes(searchId));

                        if (isAllowedMatch) {
                            const applyStyles = (element) => {
                                if (config.color) {
                                    if (currentId.includes('cerne') || currentId.includes('trace') || currentId.includes('sourcil')) {
                                        element.style.setProperty('stroke', config.color, 'important');
                                        element.setAttribute('stroke', config.color);
                                    } else {
                                        element.style.setProperty('fill', config.color, 'important');
                                        element.setAttribute('fill', config.color);
                                    }
                                }
                                if (config.opacity !== undefined) {
                                    element.style.setProperty('opacity', config.opacity, 'important');
                                    element.setAttribute('opacity', config.opacity);
                                }
                            };

                            applyStyles(el);
                            el.querySelectorAll('path, polygon, rect, circle, ellipse, g, polyline, line').forEach(applyStyles);
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
        setTimeout(executeUpdate, 150);
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

    const skinInput = document.getElementById('skin-color');
    if (skinInput) {
        skinInput.addEventListener('input', () => applyAllMappings());
    }

    if (shadowOpacityInput) {
        shadowOpacityInput.addEventListener('input', () => applyAllMappings());
    }

    setTimeout(() => {
        applyAllMappings();
        applyEyebrowsColor();
    }, 200);

});