document.addEventListener('DOMContentLoaded', () => {
    const storage = new StorageManager();
    const canvas = document.getElementById('neuralCanvas');
    const nodeManager = new NodeManager(storage, canvas);
    
    // Setup topic list
    const topicList = document.querySelector('.topic-list');
    const addTopicBtn = document.querySelector('.add-topic');
    
    function renderTopics() {
        const topics = storage.getTopics();
        topicList.innerHTML = '';
        
        topics.forEach(topic => {
            const li = document.createElement('li');
            li.textContent = topic;
            if (topic === storage.getCurrentTopic()) {
                li.classList.add('active');
            }
            
            li.addEventListener('click', () => {
                storage.setCurrentTopic(topic);
                nodeManager.loadNodes(topic);
                document.querySelectorAll('.topic-list li').forEach(el => {
                    el.classList.remove('active');
                });
                li.classList.add('active');
            });
            
            topicList.appendChild(li);
        });
    }
    
    addTopicBtn.addEventListener('click', () => {
        const topicName = prompt('Enter new topic name:');
        if (topicName && topicName.trim()) {
            storage.addTopic(topicName.trim());
            renderTopics();
        }
    });
    
    // Initialize
    renderTopics();
    
    // Global event listeners for dragging
    document.addEventListener('mousemove', (e) => {
        nodeManager.handleNodeDrag(e);
    });
    
    document.addEventListener('mouseup', () => {
        nodeManager.endNodeDrag();
    });
    
    // Node popup overlay
    document.querySelector('.overlay').addEventListener('click', () => {
        document.querySelector('.node-popup').classList.remove('visible');
        document.querySelector('.overlay').classList.remove('visible');
    });
});
