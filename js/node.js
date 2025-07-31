class NodeManager {
    constructor(storage, canvas) {
        this.storage = storage;
        this.canvas = canvas;
        this.nodes = [];
        this.connections = [];
        this.currentTopic = '';
        this.selectedNode = null;
        this.dragging = false;
        this.dragStartX = 0;
        this.dragStartY = 0;
        this.nodeStartX = 0;
        this.nodeStartY = 0;
        this.canvasPos = { x: 0, y: 0 };
        this.canvasStartPos = { x: 0, y: 0 };
        this.panning = false;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.currentTopic = this.storage.getCurrentTopic();
        if (this.currentTopic) {
            this.loadNodes(this.currentTopic);
        }
    }

    setupEventListeners() {
        this.canvas.addEventListener('mousedown', (e) => {
            if (e.target === this.canvas) {
                this.panning = true;
                this.canvasStartPos = { x: this.canvasPos.x, y: this.canvasPos.y };
                this.dragStartX = e.clientX;
                this.dragStartY = e.clientY;
                this.canvas.style.cursor = 'grabbing';
            }
        });

        document.addEventListener('mousemove', (e) => {
            if (this.panning) {
                const dx = e.clientX - this.dragStartX;
                const dy = e.clientY - this.dragStartY;
                this.canvasPos.x = this.canvasStartPos.x + dx;
                this.canvasPos.y = this.canvasStartPos.y + dy;
                this.canvas.style.transform = `translate(${this.canvasPos.x}px, ${this.canvasPos.y}px)`;
            } else if (this.dragging) {
                this.handleNodeDrag(e);
            }
        });

        document.addEventListener('mouseup', () => {
            if (this.panning) {
                this.panning = false;
                this.canvas.style.cursor = 'default';
            }
            if (this.dragging) {
                this.endNodeDrag();
            }
        });

        document.querySelector('.add-node').addEventListener('click', () => {
            const centerX = this.canvas.clientWidth / 2 - this.canvasPos.x;
            const centerY = this.canvas.clientHeight / 2 - this.canvasPos.y;
            this.createNode(centerX, centerY);
        });
    }

    loadNodes(topicName) {
        this.clearCanvas();
        this.currentTopic = topicName;
        this.nodes = this.storage.getNodes(topicName);
        
        this.nodes.forEach(node => {
            this.createNodeElement(node);
        });
        
        this.updateConnections();
    }

    clearCanvas() {
        document.querySelectorAll('.node').forEach(el => el.remove());
        document.querySelectorAll('.connection-line').forEach(el => el.remove());
        this.nodes = [];
        this.connections = [];
    }

    createNode(x, y, parentId = null) {
    if (!this.currentTopic) return;
    
    // Calculate center of visible area
    const canvasRect = this.canvas.getBoundingClientRect();
    const container = this.canvas.parentElement;
    const scrollLeft = container.scrollLeft;
    const scrollTop = container.scrollTop;
    
    // If no specific coordinates provided, use center of viewport
    if (x === undefined || y === undefined) {
        const centerX = container.clientWidth / 2 + scrollLeft - canvasRect.left;
        const centerY = container.clientHeight / 2 + scrollTop - canvasRect.top;
        x = centerX - this.canvasPos.x;
        y = centerY - this.canvasPos.y;
    }
    
    const nodeId = Date.now().toString();
    const newNode = {
        id: nodeId,
        x,
        y,
        title: `Node ${this.nodes.length + 1}`,
        parentId,
        children: []
    };
    
    if (parentId) {
        const parent = this.nodes.find(n => n.id === parentId);
        if (parent) {
            parent.children.push(nodeId);
        }
    }
    
    this.nodes.push(newNode);
    this.storage.saveNodes(this.currentTopic, this.nodes);
    this.createNodeElement(newNode);
    this.updateConnections();
    
    // Center the view on the new node if it's not already visible
    this.ensureNodeIsVisible(nodeId);
}

ensureNodeIsVisible(nodeId) {
    const node = this.nodes.find(n => n.id === nodeId);
    if (!node) return;
    
    const container = this.canvas.parentElement;
    const nodeEl = document.querySelector(`.node[data-id="${nodeId}"]`);
    if (!nodeEl) return;
    
    const nodeRect = nodeEl.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    
    // Calculate required scroll positions
    const nodeCenterX = nodeRect.left + nodeRect.width/2;
    const nodeCenterY = nodeRect.top + nodeRect.height/2;
    const containerCenterX = containerRect.left + containerRect.width/2;
    const containerCenterY = containerRect.top + containerRect.height/2;
    
    // Calculate needed scroll adjustment
    const scrollLeft = container.scrollLeft + (nodeCenterX - containerCenterX);
    const scrollTop = container.scrollTop + (nodeCenterY - containerCenterY);
    
    // Smooth scroll to center the node
    container.scrollTo({
        left: scrollLeft,
        top: scrollTop,
        behavior: 'smooth'
    });
}

    createNodeElement(node) {
        const nodeEl = document.createElement('div');
        nodeEl.className = 'node';
        nodeEl.style.left = `${node.x}px`;
        nodeEl.style.top = `${node.y}px`;
        nodeEl.dataset.id = node.id;
        
        if (node.parentId) {
            nodeEl.classList.add('child-node');
        } else {
            nodeEl.classList.add('root-node');
        }
        
        const titleEl = document.createElement('div');
        titleEl.className = 'node-title';
        titleEl.textContent = node.title;
        nodeEl.appendChild(titleEl);
        
        this.adjustTextSize(titleEl);
        
        nodeEl.addEventListener('click', (e) => {
            e.stopPropagation();
            this.openNodePopup(node);
        });
        
        nodeEl.addEventListener('dblclick', (e) => {
            e.stopPropagation();
            this.createNode(node.x + 150, node.y + 150, node.id);
        });
        
        nodeEl.addEventListener('mousedown', (e) => {
            e.stopPropagation();
            this.dragging = true;
            this.selectedNode = node;
            this.dragStartX = e.clientX;
            this.dragStartY = e.clientY;
            this.nodeStartX = node.x;
            this.nodeStartY = node.y;
            nodeEl.style.cursor = 'grabbing';
        });
        
        this.canvas.appendChild(nodeEl);
    }

    adjustTextSize(titleEl) {
        const text = titleEl.textContent;
        const length = text.length;
        
        let fontSize = 16;
        if (length > 15) fontSize = 14;
        if (length > 25) fontSize = 12;
        if (length > 35) fontSize = 10;
        if (length > 50) fontSize = 8;
        
        titleEl.style.fontSize = `${fontSize}px`;
        titleEl.style.lineHeight = `${fontSize + 2}px`;
    }

    openNodePopup(node) {
        const popup = document.querySelector('.node-popup');
        const overlay = document.querySelector('.overlay');
        const titleInput = popup.querySelector('.node-title-input');
        const contentInput = popup.querySelector('.node-content');
        
        titleInput.value = node.title;
        contentInput.value = this.storage.getNodeContent(this.currentTopic, node.id);
        
        popup.dataset.nodeId = node.id;
        popup.classList.add('visible');
        overlay.classList.add('visible');
        
        popup.querySelector('.save-node').onclick = () => {
            node.title = titleInput.value;
            this.storage.saveNodes(this.currentTopic, this.nodes);
            this.storage.saveNodeContent(this.currentTopic, node.id, contentInput.value);
            
            const nodeEl = document.querySelector(`.node[data-id="${node.id}"] .node-title`);
            if (nodeEl) {
                nodeEl.textContent = node.title;
                this.adjustTextSize(nodeEl);
            }
            
            popup.classList.remove('visible');
            overlay.classList.remove('visible');
        };
        
        popup.querySelector('.close-popup').onclick = () => {
            popup.classList.remove('visible');
            overlay.classList.remove('visible');
        };
    }

    updateConnections() {
        document.querySelectorAll('.connection-line').forEach(el => el.remove());
        this.connections = [];
        
        this.nodes.forEach(node => {
            node.children.forEach(childId => {
                const child = this.nodes.find(n => n.id === childId);
                if (child) {
                    this.createConnection(node, child);
                }
            });
        });
    }

    createConnection(parent, child) {
        const line = document.createElement('div');
        line.className = 'connection-line';
        
        const x1 = parent.x + (parent.parentId ? 55 : 65);
        const y1 = parent.y + (parent.parentId ? 55 : 65);
        const x2 = child.x + (child.parentId ? 55 : 65);
        const y2 = child.y + (child.parentId ? 55 : 65);
        
        const length = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
        const angle = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;
        
        line.style.width = `${length}px`;
        line.style.left = `${x1}px`;
        line.style.top = `${y1}px`;
        line.style.transform = `rotate(${angle}deg)`;
        
        this.canvas.appendChild(line);
        this.connections.push(line);
    }

    handleNodeDrag(e) {
        if (!this.dragging || !this.selectedNode) return;
        
        const dx = e.clientX - this.dragStartX;
        const dy = e.clientY - this.dragStartY;
        
        this.selectedNode.x = this.nodeStartX + dx;
        this.selectedNode.y = this.nodeStartY + dy;
        
        const nodeEl = document.querySelector(`.node[data-id="${this.selectedNode.id}"]`);
        if (nodeEl) {
            nodeEl.style.left = `${this.selectedNode.x}px`;
            nodeEl.style.top = `${this.selectedNode.y}px`;
        }
        
        this.updateConnections();
    }

    endNodeDrag() {
        if (this.dragging && this.selectedNode) {
            this.storage.saveNodes(this.currentTopic, this.nodes);
            document.querySelectorAll('.node').forEach(el => {
                el.style.cursor = 'move';
            });
        }
        this.dragging = false;
        this.selectedNode = null;
    }
}
