import {html, render, TemplateResult} from 'lit-html';
import lottie from 'lottie-web';
import tester from '../svg/loading_animation.json';
import {pauseButton, placeButton, playButton} from './icons';
import {MessageBus} from '../../shared/MessageBus';
import {unsafeHTML} from 'lit-html/directives/unsafe-html.js';
import {button} from './button';
import {PropertyBinding, UserDataValue} from '../../plugin/Strapi';

type LottieData = {
    id: string,
    description: string,
    value: string | null,
    onUpdate?: (id: string, value: Exclude<UserDataValue, PropertyBinding>, refreshLayerView: boolean) => void,
}

function lottiePlayer(bus: MessageBus, data: LottieData): TemplateResult {
    const container = document.createElement('div');
    container.classList.add('lottie-animation');

    const animationData = JSON.parse(data.value!);
    console.log(animationData);
    const animation = lottie.loadAnimation({
        container: container,
        renderer: 'svg',
        loop: true,
        autoplay: false,
        animationData: JSON.parse(animationData.animation),
    });
    const animationTotalFrames = animation.totalFrames - 1;
    let fromFrame = animationData.from;
    let toFrame = animationData.to;

    const progress = document.createElement('div');
    progress.classList.add('lottie-play-progress');
    progress.style.width = '0';

    const from = document.createElement('div');
    from.classList.add('lottie-play-from');
    from.style.left = `${(fromFrame / animationTotalFrames) * 100}%`;
    from.addEventListener('mousedown', handleMouseDown);

    const fromArea = document.createElement('div');
    fromArea.classList.add('lottie-play-from-area');
    fromArea.style.width = from.style.left;

    const to = document.createElement('div');
    to.classList.add('lottie-play-to');
    to.style.left = `${(toFrame / animationTotalFrames) * 100}%`;
    to.addEventListener('mousedown', handleMouseDown);

    const toArea = document.createElement('div');
    toArea.classList.add('lottie-play-to-area');
    toArea.style.width = `${100 - parseFloat(to.style.left)}%`;

    animation.addEventListener('enterFrame', (e) => {
        progress.style.width = `${Math.round(((animation.currentFrame + fromFrame) / animationTotalFrames) * 100)}%`;
    });

    const controlButton = document.createElement('div');
    controlButton.classList.add('icon-button');
    render(playButton, controlButton);

    controlButton.addEventListener('click', () => {
        if (animation.isPaused) {
            animation.play();
            render(pauseButton, controlButton);
        } else {
            animation.pause();
            render(playButton, controlButton);
        }
    });

    let barElement: HTMLElement | null = null;
    let fromElement: HTMLElement | null = null;
    let toElement: HTMLElement | null = null;
    let mouseDown = false;

    function percentToFrame(percent: number): number {
        return Math.floor(percent * animationTotalFrames);
    }
    function getTargetFrame(el: HTMLElement, evt: MouseEvent): number {
        const rect = el.getBoundingClientRect();
        const x = evt.clientX - rect.left;
        const percent = Math.min(1.0, Math.max(0.0, x / rect.width));
        return percentToFrame(percent) - fromFrame;
    }

    function handleMouseDown(this: HTMLElement, evt: MouseEvent) {
        if (this === from) {
            fromElement = this;
            return;
        } else if (this === to) {
            toElement = this;
            return;
        }

        mouseDown = true;
        barElement = this;

        let targetFrame = getTargetFrame(barElement, evt);
        if (!fromElement && !toElement) {
            targetFrame = Math.max(0, Math.min(animation.totalFrames, targetFrame));
        }
        animation.goToAndStop(targetFrame, true);
        render(playButton, controlButton);
    }

    function handleMouseUp() {
        mouseDown = false;
        barElement = null;
        fromElement = null;
        toElement = null;
    }

    // debounce calling `data.onUpdate` to avoid clogging the plugin bridge
    let timeout: number | null = null;
    function updateSegment() {
        fromFrame = percentToFrame(parseFloat(from.style.left) / 100);
        toFrame = percentToFrame(parseFloat(to.style.left) / 100);
        animation.setSegment(fromFrame, toFrame);
        if (timeout) {
            window.clearTimeout(timeout);
        }

        timeout = window.setTimeout(() => {
            if (data.onUpdate) {
                const newData = {
                    from: fromFrame,
                    to: toFrame,
                    animation: animationData.animation,
                }
                data.onUpdate(data.id, JSON.stringify(newData), false);
                timeout = null;
            }
        }, 500);
    }

    // update the segment once to initialize the animation to the constraints in the data
    updateSegment();
    animation.goToAndStop(0, true);

    function updateFrom() {
        from.style.left = progress.style.width;
        fromArea.style.width = progress.style.width;
        if (parseFloat(from.style.left) > parseFloat(to.style.left)) {
            updateTo();
        } else {
            updateSegment();
        }
    }

    function updateTo() {
        to.style.left = progress.style.width;
        toArea.style.width = `${100 - parseFloat(progress.style.width)}%`;
        if (parseFloat(to.style.left) < parseFloat(from.style.left)) {
            updateFrom();
        } else {
            updateSegment();
        }
    }

    function handleMouseMove(evt: MouseEvent) {
        if (mouseDown && barElement) {
            let targetFrame = getTargetFrame(barElement, evt);
            if (!fromElement && !toElement) {
                targetFrame = Math.max(0, Math.min(animation.totalFrames, targetFrame));
            }
            animation.goToAndStop(targetFrame, true);
            render(playButton, controlButton);

            if (fromElement) {
                updateFrom();
            }

            if (toElement) {
                updateTo();
            }
        }
    }

    document.addEventListener('mouseup', handleMouseUp);
    document.body.addEventListener('mouseleave', handleMouseUp);
    document.addEventListener('mousemove', handleMouseMove);

    return html`
        <div class="lottie-player">
            ${container}
            <div class="lottie-controls">
                ${controlButton}
                <div 
                    class="lottie-play-bar"
                    @mousedown=${handleMouseDown}
                >
                    ${[fromArea, from, toArea, to, progress]}
                </div>
                <div 
                    class="icon-button"
                    @click="${async function() {
                        const originalSvg = container.innerHTML;
                        const c = document.createElement('div');
                        render(html`${unsafeHTML(originalSvg)}`, c);
                        const layerSize = await bus.execute('getLayerSize', data.id );
                        const svgEl = c.children[0] as SVGElement;
                        svgEl.setAttribute('width', `${layerSize.width}`);
                        svgEl.setAttribute('height', `${layerSize.height}`);
                        const svgStr = svgEl.outerHTML;
                        await bus.execute('replaceContentsWithSvg', {
                            id: data.id,
                            svg: svgStr,
                        });
                    }}"
                >
                    ${placeButton}
                </div>
            </div>
        </div>
    `;
}

function loadFile(file: File): Promise<string|null> {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            resolve(e.target?.result as string);
        };
        reader.readAsText(file);
    });
}

export function lottieInput(bus: MessageBus, data: LottieData): TemplateResult {
    console.log('lottieInput', data);
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.json';
    fileInput.style.display = 'none';
    fileInput.addEventListener('change', async (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (file) {
            const content = await loadFile(file);
            if (content) {
                try {
                    const json = JSON.parse(content);
                    const animation = lottie.loadAnimation(
                        {
                            container: document.createElement('div'),
                            renderer: 'svg',
                            loop: true,
                            autoplay: false,
                            animationData: json,
                        }
                    );
                    const totalFrames = animation.totalFrames;
                    animation.destroy();
                    if (data.onUpdate) {
                        const animationData = {
                            from: 0,
                            to: totalFrames - 1,
                            animation: content,
                        }
                        data.onUpdate(data.id, JSON.stringify(animationData), true);
                    }
                } catch (_) {
                    console.error('Invalid JSON loaded for lottie animation.');
                }
            }
        }
    });

    return html`
        ${data.value ? html`<div class="row-full">${lottiePlayer(bus, data)}</div>` : null}
        <div class="row-full">
            <div class="container padding-top-8">
                ${button({
                    id: data.id,
                    label: 'Load',
                    onClick: (id: string) => fileInput.click(),
                })}
            </div>
        </div>
    `;
}