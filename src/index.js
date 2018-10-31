class DOMSpy {

    constructor() {
        window.events = [];
        window.DOMSnapshot = {};
        window.DOMChangedEvent = new Event('dom-changed');
        // var head = document.getElementsByTagName('head')[0];
        // var jq = document.createElement('script');
        // jq.src = "https://code.jquery.com/jquery-3.3.1.min.js";
        // head.appendChild(jq);
        window.getAllElements = getAllElements;
        window.getAllPropertyNames = getAllPropertyNames;
        window.toDict = serialize;
        window.eventToDict = eventToDict;
        window.takeDOMSnapshot = takeDOMSnapshot;
        window.getNodeUniqueId = getNodeUniqueId;
        window.getPathTo = getPathTo;
        window.sessionStart = (new Date).getTime();
        window.observer = new MutationObserver(mutations => {
            mutations.forEach(mutation => {
                console.log(JSON.stringify(getAllPropertyNames(mutation)));
            })
        })


        this.getAllElements().forEach(el => observer.observe(el, {
            childList: true,
            attributes: true
        }));
        this.getAllElements().forEach(el => registerListener('click', el, recordEvent));
        this.getAllElements().forEach(el => registerListener('change', el, recordEvent));

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
            return props.concat(getAllPropertyNames(obj.__proto__))
        }
        else {
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

        dict = {}
        getAllPropertyNames(obj).filter(included).filter(notExcluded).forEach(n => dict[n] = obj[n]);
        return dict;
    }

    eventToDict(e) {
        var res = {};
        res['nodeUID'] = getNodeUniqueId(e.node);
        res['event'] = serialize(e.event, excluded = ['target']);
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
        fields = [];
        fields.push(node.id.length > 0 ? `id${keySeparator}${node.id}` : null); //TODO: Implement full recognition
        fields.push(node.classList.length > 0 ? `id${keySeparator}${node.id}` : null);
        return fields.filter(f => f !== null).join(fieldSeparator)
    }

    stampNode(node) {
        let uid = getNodeUniqueId(node);
        node.setAttribute('bfy-uid', uid);
        let hirarchy = getPathTo(node);
        node.setAttribute('bfy-hirarchy', hirarchy);
    }

    takeDOMSnapshot() {
        return getAllElements().map(serialize)
    }

    recordEvent(event) {
        event.stopPropagation();

        var isActive = document.activeElement === event.target;

        events.push(eventToDict({
            'at': new Date(),
            'node': event.target,
            'event': event,
            'isActive': isActive
        }));
    }

}

exports.dad = new Dad();
