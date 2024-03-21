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
    onUpdate?: (id: string, value: Exclude<UserDataValue, PropertyBinding>) => void,
}

function lottiePlayer(bus: MessageBus, data: LottieData): TemplateResult {
    const container = document.createElement('div');
    container.classList.add('lottie-animation');

    const animationData = JSON.parse(data.value!);
    const animation = lottie.loadAnimation({
        container: container,
        renderer: 'svg',
        loop: true,
        autoplay: false,
        animationData: animationData,
    });

    const progress = document.createElement('div');
    progress.classList.add('lottie-play-progress');

    animation.addEventListener('enterFrame', (e) => {
        progress.style.width = `${Math.round((animation.currentFrame / animation.totalFrames) * 100)}%`;
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
    let mouseDown = false;

    function getTargetFrame(el: HTMLElement, evt: MouseEvent): number {
        const rect = el.getBoundingClientRect();
        const x = evt.clientX - rect.left;
        const percent = Math.min(1.0, Math.max(0.0, x / rect.width));
        return Math.floor(percent * (animation.totalFrames - 1));
    }

    function handleMouseDown(this: HTMLElement, evt: MouseEvent) {
        mouseDown = true;
        barElement = this;
        animation.goToAndStop(getTargetFrame(barElement, evt), true);
        render(playButton, controlButton);
    }

    function handleMouseUp() {
        mouseDown = false;
        barElement = null;
    }

    function handleMouseMove(evt: MouseEvent) {
        if (mouseDown && barElement) {
            animation.goToAndStop(getTargetFrame(barElement, evt), true);
            render(playButton, controlButton);
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
                    ${progress}
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
                    lottie.loadAnimation(
                        {
                            container: document.createElement('div'),
                            renderer: 'svg',
                            loop: true,
                            autoplay: false,
                            animationData: json,
                        }
                    );
                    if (data.onUpdate) {
                        data.onUpdate(data.id, content);
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