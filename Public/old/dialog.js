class Dialog{
    constructor(content, title=""){
        this.dom = document.createElement('div');
            this.dom.className = 'dialog dialog-overlay';
        let dialog = document.createElement('dialog');
            dialog.setAttribute('open', true);
            let dialogHeader = document.createElement('div');
                dialogHeader.className = 'head';
                dialogHeader.innerHTML = title;
                let dialogClose = document.createElement('button');
                    dialogClose.className = 'close';
                dialogHeader.append(dialogClose);
            let dialogBody = document.createElement('div');
                dialogBody.className = 'body';
                dialogBody.append(content);
        dialog.append(dialogHeader, dialogBody);
        this.dom.append(dialog);
        dialog.addEventListener('click', (e)=>{
            e.preventDefault();
            e.stopImmediatePropagation();
        })
        dialogClose.addEventListener('click', this.close.bind(this));
        this.dom.addEventListener('click', this.close.bind(this));
        document.body.append(this.dom)
    }
    close(){
        this.dom.remove();
    }
}