class Tabs{
    constructor(data){
        this.dom = document.createElement('div');
            this.dom.className = 'tabs';
        this.tabsList = document.createElement('ul');
            this.tabsList.className = 'tabs-list';
        Object.keys(data).forEach((tab, i)=>{
            let li = document.createElement('li');
                li.innerHTML = tab;
                li.addEventListener('click', this.switch.bind(this, i))
            this.tabsList.append(li);
        })
        this.tabsContent = document.createElement('div');
            this.tabsContent.className = 'tabs-content';
        Object.values(data).forEach(content=>{
            let body = document.createElement('div');
                body.className = 'tabs-body';
                body.append(content);
            this.tabsContent.append(body);
        })
        this.dom.append(this.tabsList, this.tabsContent)
        this.switch(0)
    }
    switch(tab_index){
        [...this.tabsList.childNodes].forEach((t, i)=>{
            t.classList.remove('active');
            if(i == tab_index) t.classList.add('active');
        });
        [...this.tabsContent.childNodes].forEach((b, i)=>{
            b.style.display = 'none';
            if(i == tab_index) b.style.display = 'block';
        })
    }
}