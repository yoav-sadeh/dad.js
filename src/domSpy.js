class Crawler {

    constructor() {
        this.events = [];
        //this.recordEvent.bind(this);
        this.DOMSnapshot = {};
        this.DOMChangedEvent = new Event('dom-changed');

        this.sessionStart = (new Date).getTime();
        this.observer = new MutationObserver(mutations => {
            mutations.forEach(mutation => {
                console.log(JSON.stringify(this.getAllPropertyNames(mutation)));
            })
        })

        this.getAllElements().forEach(el => this.observer.observe(el, {
            childList: true,
            attributes: true
        }));
        const vm = this;
        this.getAllElements().forEach(el => this.registerListener('click', el, e => vm.recordEvent(e)));
        this.getAllElements().forEach(el => this.registerListener('change', el, e => vm.recordEvent(e)));

    }

    getAllElements() {
        return Array.prototype.slice.call(document.getElementsByTagName('*'));
    }

    registerListener(listenerName, node, handler) {
        node.addEventListener(listenerName, handler);
    }

    getAllPropertyNames(obj) {
        var props = Object.getOwnPropertyNames(obj);
        if (obj.__proto__ != null) {
            return props.concat(this.getAllPropertyNames(obj.__proto__))
        } else {
            return props;
        }
    }

    serialize(obj, exclusions = [], inclusions = []) {
        function notExcluded(n) {
            return !exclusions.filter(v => v.includes(n)).length > 0;
        }

        function included(n) {
            return inclusions.length === 0 || inclusions.includes(n);
        }

        const dict = {}
        this.getAllPropertyNames(obj).filter(included).filter(notExcluded).forEach(n => dict[n] = obj[n]);
        return dict;
    }

    eventToDict(e) {
        var res = {};
        res['nodeUID'] = this.getNodeUniqueId(e.node);
        res['event'] = this.serialize(e.event, ['target']);
        res['at'] = e.at;
        res['isActive'] = document.activeElement == e.node;
        return res;
    }

    getPathTo(element) {
        if (element.tagName == 'HTML')
            return '/HTML[1]';
        if (element === document.body)
            return '/HTML[1]/BODY[1]';

        var ix = 0;
        var siblings = element.parentNode.childNodes;
        for (var i = 0; i < siblings.length; i++) {
            var sibling = siblings[i];
            if (sibling === element)
                return getPathTo(element.parentNode) + '/' + element.tagName + '[' + (ix + 1) + ']';
            if (sibling.nodeType === 1 && sibling.tagName === element.tagName)
                ix++;
        }
    }


    getNodeUniqueId(node) {
        const keySeparator = "$$";
        const fieldSeparator = '|';
        this.fields = [];
        this.fields.push(node.id.length > 0 ? `id${keySeparator}${node.id}` : null); //TODO: Implement full recognition
        this.fields.push(node.classList.length > 0 ? `id${keySeparator}${node.id}` : null);
        return this.fields.filter(f => f !== null).join(fieldSeparator)
    }

    stampNode(node) {
        let uid = this.getNodeUniqueId(node);
        node.setAttribute('bfy-uid', uid);
        let hirarchy = this.getPathTo(node);
        node.setAttribute('bfy-hirarchy', hirarchy);
    }

    takeDOMSnapshot() {
        return this.getAllElements().map(serialize)
    }

    recordEvent(event) {
        event.stopPropagation();

        var isActive = document.activeElement === event.target;

        this.events.push(this.eventToDict({
            'at': new Date(),
            'node': event.target,
            'event': event,
            'isActive': isActive
        }));
    }

}

const crawler = new Crawler()
