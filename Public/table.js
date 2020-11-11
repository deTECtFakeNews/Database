// const Data = require("../Data");

class Table{
    static Row = {}
    constructor(data){
        this.dom = document.createElement('table');
            this.dom.id = "table";
        let thead = document.createElement('thead');
        Object.keys(data[0]).forEach(k=>{
            if( k[0] != '_' ){
                let th = document.createElement('th');
                th.innerHTML = k;
                thead.append(th);
            }
            
        })
        this.dom.append(thead);
        data.forEach(d=>{
                this.dom.append( new Table.Row(d).dom )
        });
    }
}
Table.Row = class{
    constructor(data){
        this.dom = document.createElement('tr');
        Object.keys(data).forEach(v=>{
            if( v[0] != '_'){
                let td = document.createElement('td');
                    td.innerHTML = JSON.stringify(data[v]);
                this.dom.append(td)
            }
        });
        this.dom.addEventListener('click', ()=>{
            new TweetClient(data).openDialog()
        })

    }
}

class DetailsTable{
    constructor(data, title){
        this.dom = document.createElement('table');
            this.dom.className = 'details-table';
        if(title){
            let thead = document.createElement('thead');
                thead.innerHTML = `<th colspan=2>${title}</th>`;
            this.dom.append(thead);
        }
        Object.keys(data).forEach(key=>{
            console.log(data);
            let tr = document.createElement('tr');
            let td_key = document.createElement('td');
                td_key.innerHTML = key;
            let td_val = document.createElement('td');
            if(data[key] != null && typeof data[key] == "object" && data[key]['text'] != undefined){
                let a = document.createElement('a');
                    a.innerHTML = data[key].text;
                    a.href = "";
                    a.addEventListener('click', data[key]['click']);
                td_val.append(a)
            } else {
                td_val.innerHTML = data[key]
            }
            tr.append(td_key, td_val);
            this.dom.append(tr);
        })
    }
}