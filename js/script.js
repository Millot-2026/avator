window.addEventListener('DOMContentLoaded', () => {

    // 1. CONFIGURATION CENTRALE
    const COLOR_MAPPING = {
        'skin-color': [
            { layerId: 'layer-tete', targetIds: ['VISAGE-ANGULAIRE', 'VISAGE-ANGULAIRE-2'] },
            { layerId: 'layer-cou', targetIds: ['cou-angulaire'] }
        ],
        'shadow-color': [
            { layerId: 'layer-menton', targetIds: ['OMBRE-BAS-ANGULAIR-DROIT', 'OMBRE-BAS-ANGULAIR-GAUCHE'] },
            // Les triangles de relief/creux des joues pilotés par la couleur des ombres
            { layerId: 'layer-tempes', targetIds: ['TEMPES-GAUCHE', 'TEMPES-DROIT'] }
        ],
        'hair-top-color': [
            { layerId: 'layer-cheveux', targetIds: ['CHEVEUX-TOP', 'CHEVVEUX-TOP'] }
        ],
        'hair-sides-color': [
            { layerId: 'layer-cheveux', targetIds: ['CHEVEUX-TEMPE-DROIT', 'CHEVEUX-TEMPE-GAUCHE'] }
        ],
        'eyes-color': [
            { layerId: 'layer-yeux', targetIds: ['PUPILLE-GAUCHE', 'PUPILLE-DROITE'] }
        ]
    };

    const shadowOpacityInput = document.getElementById('shadow-opacity-range');

    // 2. MOTEUR D'APPLICATION (Couleur + Opacité)
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

                        const isCerne = currentId.includes('cerne');
                        const isAllowedMatch = (currentId === searchId || currentId.includes(searchId));

                        if (isAllowedMatch && !isCerne) {

                            const applyStyles = (element) => {
                                if (config.color) {
                                    element.style.setProperty('fill', config.color, 'important');
                                    element.setAttribute('fill', config.color);
                                }
                                if (config.opacity !== undefined) {
                                    element.style.setProperty('opacity', config.opacity, 'important');
                                    element.setAttribute('opacity', config.opacity);
                                }
                            };

                            applyStyles(el);
                            el.querySelectorAll('path, polygon, rect, circle, ellipse, g').forEach(applyStyles);
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

    // 3. SYNCHRONISATION GLOBALE
    function applyAllMappings() {
        Object.keys(COLOR_MAPPING).forEach(inputId => {
            const input = document.getElementById(inputId);
            if (!input) return;

            const colorValue = input.value;
            let opacityValue = undefined;

            if (inputId === 'shadow-color' && shadowOpacityInput) {
                opacityValue = shadowOpacityInput.value;
            }

            COLOR_MAPPING[inputId].forEach(mapping => {
                updateSvgElements(mapping.layerId, mapping.targetIds, {
                    color: colorValue,
                    opacity: opacityValue
                });
            });
        });

        if (shadowOpacityInput) {
            const shadowColorInput = document.getElementById('shadow-color');
            COLOR_MAPPING['shadow-color'].forEach(mapping => {
                updateSvgElements(mapping.layerId, mapping.targetIds, {
                    color: shadowColorInput ? shadowColorInput.value : undefined,
                    opacity: shadowOpacityInput.value
                });
            });
        }
    }

    // 4. ÉCOUTEURS D'ÉVÉNEMENTS
    Object.keys(COLOR_MAPPING).forEach(inputId => {
        const input = document.getElementById(inputId);
        if (input) {
            input.addEventListener('input', applyAllMappings);
        }
    });

    if (shadowOpacityInput) {
        shadowOpacityInput.addEventListener('input', applyAllMappings);
    }

    // Application initiale
    setTimeout(applyAllMappings, 300);

});