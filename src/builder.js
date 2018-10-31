function eventExists(event){
    return true;
}

class DadBuilder{
    constructor(){
        this.events = []
        this.stampId = false;
    }
    withIdStamps(){
        this.stampId = true;
        return this;
    }

    trackEvent(event){
        return this.trackEvents([event])
    }
    trackEvents(events){
        let nonExistantEvents = events.filter(e => eventExists(e) === false);
        if(nonExistantEvents.length > 0){
            console.log(nonExistantEvents)
            throw `Events: ${nonExistantEvents} don't exist.`

        }
        this.events.push(...events)
        return this;
    }
}

module.exports = DadBuilder