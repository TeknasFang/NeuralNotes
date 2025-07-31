class StorageManager {
    constructor() {
        this.topicsKey = 'neuralNotes_topics';
        this.currentTopicKey = 'neuralNotes_currentTopic';
    }

    getTopics() {
        const topics = localStorage.getItem(this.topicsKey);
        return topics ? JSON.parse(topics) : [];
    }

    saveTopics(topics) {
        localStorage.setItem(this.topicsKey, JSON.stringify(topics));
    }

    addTopic(topicName) {
        const topics = this.getTopics();
        if (!topics.includes(topicName)) {
            topics.push(topicName);
            this.saveTopics(topics);
        }
        return topics;
    }

    removeTopic(topicName) {
        const topics = this.getTopics().filter(t => t !== topicName);
        this.saveTopics(topics);
        return topics;
    }

    getCurrentTopic() {
        return localStorage.getItem(this.currentTopicKey) || '';
    }

    setCurrentTopic(topicName) {
        localStorage.setItem(this.currentTopicKey, topicName);
    }

    getNodes(topicName) {
        const nodes = localStorage.getItem(`neuralNotes_nodes_${topicName}`);
        return nodes ? JSON.parse(nodes) : [];
    }

    saveNodes(topicName, nodes) {
        localStorage.setItem(`neuralNotes_nodes_${topicName}`, JSON.stringify(nodes));
    }

    getNodeContent(topicName, nodeId) {
        const content = localStorage.getItem(`neuralNotes_content_${topicName}_${nodeId}`);
        return content || '';
    }

    saveNodeContent(topicName, nodeId, content) {
        localStorage.setItem(`neuralNotes_content_${topicName}_${nodeId}`, content);
    }
}
