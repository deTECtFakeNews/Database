class QueryClient{
    constructor(q){
    }

    renderCard(){
        let container = document.createElement('div');
        container.className = 'fn-ui-query';
        let recurrence = document.createElement('div');
        recurrence.className = 'fn-ui-query-recurrence';
        recurrence.innerHTML = 'Recurrencia: QueryRecurrence';
        let title = document.createElement('h2');
        title.innerHTML = 'QueryQuery';
        let meta = document.createElement('div');
        meta.className = 'fn-ui-query-meta';
        meta.innerHTML = '(12 Tweets - Act: Hoy)';
        container.append(recurrence, title, meta);
        container.addEventListener('click', this.renderPanel.bind(this))

        return {dom: container};
    }

    renderPanel(){
        let container = document.createElement('div');
        
        let title = document.createElement('h1');
        title.innerHTML = 'QueryQuery';

        let params = document.createElement('div')
        params.className = 'fn-ui-query_panel-params';
        params.innerHTML = 'Params will go here'

        container.append(title, params);
        new UIPanel(container);
    }
}