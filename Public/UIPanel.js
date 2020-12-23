class UIPanel{
    /**
     * Returns a screen overlay with content
     * @param {Element} content The HTML content to be rendered inside the panel
     * @param {Object<string, any>} options Option list to configure
     */
    constructor(content, options){
        content.classList.add('fn-ui-panel-body')

        this.dom = document.createElement('div');
        this.dom.className = 'fn-ui-panel';

        this.closeBtn = document.createElement('button');
        this.closeBtn.className = 'fn-ui-panel-close';
        this.closeBtn.addEventListener('click', this.close.bind(this))

        this.dom.append(content);
        this.dom.prepend(this.closeBtn)

        document.body.append(this.dom)
    }
    close(){
        this.dom.remove();
    }
}