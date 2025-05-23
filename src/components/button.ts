/**
 * RippleButton Web Component
 * 一个带有波纹效果的按钮组件
 * 使用方法：
 * 1. 引入此文件
 * 2. 使用 <p-button>按钮文本</p-button>
 * 3. 可以通过 class 属性自定义样式
 */
export class RippleButton extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this._init();
    }

    private _init() {
        // 组件样式
        const style = document.createElement('style');
        style.textContent = `
            :host {
                display: inline-block;
                position: relative;
                overflow: hidden;
                user-select: none;
                margin: 4px;
            }

            .ripple-button {
                position: relative;
                padding: 8px 16px;
                border: none;
                border-radius: 4px;
                background: var(--btn-bg, #e8f0fe);
                color: var(--btn-color, #1967d2);
                cursor: pointer;
                overflow: hidden;
                transition: all 0.3s ease;
                border: 1px solid transparent;
                font-family: inherit;
                font-size: inherit;
                // width: 100%;
                // height: 100%;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .ripple-button:hover {
                background: var(--btn-hover-ripple, rgba(16, 103, 226, 0.2));
            }

            .ripple-button:active {
                background: var(--btn-active-ripple, rgba(16, 103, 226, 0.3));
            }

            .ripple {
                position: absolute;
                border-radius: 50%;
                background: var(--btn-ripple, rgba(16, 103, 226, 0.4));
                transform: scale(0);
                animation: ripple 0.6s linear;
                pointer-events: none;
            }

            @keyframes ripple {
                to {
                    transform: scale(4);
                    opacity: 0;
                }
            }
        `;

        // 创建按钮元素
        const button = document.createElement('div');
        button.className = 'ripple-button';
        button.innerHTML = `<slot></slot>`;

        // 添加事件监听
        button.addEventListener('mousedown', this._createRipple.bind(this));

        // 将元素添加到Shadow DOM
        this.shadowRoot?.appendChild(style);
        this.shadowRoot?.appendChild(button);
    }

    private _createRipple(event: MouseEvent) {
        const button = event.currentTarget as HTMLElement;
        const ripple = document.createElement('span');
        const rect = button.getBoundingClientRect();
        const diameter = Math.max(rect.width, rect.height);
        const radius = diameter / 2;

        ripple.style.width = ripple.style.height = `${diameter}px`;
        ripple.style.left = `${event.clientX - rect.left - radius}px`;
        ripple.style.top = `${event.clientY - rect.top - radius}px`;
        ripple.className = 'ripple';

        button.appendChild(ripple);
        ripple.addEventListener('animationend', () => ripple.remove());
    }

    static get observedAttributes() {
        return ['class', 'disabled'];
    }

    attributeChangedCallback(name: string, oldValue: string, newValue: string) {
        const button = this.shadowRoot?.querySelector('.ripple-button') as HTMLElement;
        if (!button) return;

        if (name === 'class') {
            if (newValue) {
                button.classList.add(...newValue.split(' '));
            }
            if (oldValue) {
                button.classList.remove(...oldValue.split(' '));
            }
        } else if (name === 'disabled') {
            button.style.opacity = newValue !== null ? '0.5' : '1';
            button.style.cursor = newValue !== null ? 'not-allowed' : 'pointer';
        }
    }

    connectedCallback() {
        if (this.hasAttribute('class')) {
            const classes = this.getAttribute('class');
            const button = this.shadowRoot?.querySelector('.ripple-button');
            button?.classList.add(...(classes?.split(' ') || []));
        }
    }
}

// 注册自定义元素
customElements.define('p-button', RippleButton);
