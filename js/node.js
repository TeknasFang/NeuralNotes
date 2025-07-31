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
        // Canvas dragging
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
            }
        });

        document.addEventListener('mouseup', () => {
            this.panning = false;
            this.canvas.style.cursor = 'default';
        });

        // Add node button
        document.querySelector('.add-node').addEventListener('click', () => {
            this.createNode(this.canvas.clientWidth / 2 - this.canvasPos.x, 
                          this.canvas.clientHeight / 2 - this.canvasPos.y);
        });
    }

    loadNodes(topicName) {
        this.clearCanvas();
        this.currentTopic = topicName;
        this.nodes = this.storage.getNodes(topicName);
        
        // Create DOM elements for nodes
        this.nodes.forEach(node => {
            this.createNodeElement(node);
        });
        
        // Create connections
        this.updateConnections();
    }

    clearCanvas() {
        // Remove all node elements
        document.querySelectorAll('.node').forEach(el => el.remove());
        document.querySelectorAll('.connection-line').forEach(el => el.remove());
        this.nodes = [];
        this.connections = [];
    }

    createNode(x, y, parentId = null) {
        if (!this.currentTopic) return;
        
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
    }

    createNodeElement(node) {
        const nodeEl = document.createElement('div');
        nodeEl.className = 'node';
        nodeEl.style.left = `${node.x}px`;
        nodeEl.style.top = `${node.y}px`;
        nodeEl.dataset.id = node.id;
        
        const titleEl = document.createElement('div');
        titleEl.className = 'node-title';
        titleEl.textContent = node.title;
        nodeEl.appendChild(titleEl);
        
        // Node event listeners
        nodeEl.addEventListener('click', (e) => {
            e.stopPropagation();
            this.openNodePopup(node);
        });
        
        nodeEl.addEventListener('dblclick', (e) => {
            e.stopPropagation();
            this.createNode(node.x + 150, node.y + 150, node.id);
        });
        
        // Dragging
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
        
        // Save button
        popup.querySelector('.save-node').onclick = () => {
            node.title = titleInput.value;
            this.storage.saveNodes(this.currentTopic, this.nodes);
            this.storage.saveNodeContent(this.currentTopic, node.id, contentInput.value);
            
            // Update node title in DOM
            const nodeEl = document.querySelector(`.node[data-id="${node.id}"] .node-title`);
            if (nodeEl) {
                nodeEl.textContent = node.title;
            }
            
            popup.classList.remove('visible');
            overlay.classList.remove('visible');
        };
        
        // Close button
        popup.querySelector('.close-popup').onclick = () => {
            popup.classList.remove('visible');
            overlay.classList.remove('visible');
        };
    }

    updateConnections() {
        // Clear existing connections
        document.querySelectorAll('.connection-line').forEach(el => el.remove());
        this.connections = [];
        
        // Create new connections
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
        
        // Calculate line position and dimensions
        const x1 = parent.x + 60; // Center of parent node
        const y1 = parent.y + 60;
        const x2 = child.x + 60; // Center of child node
        const y2 = child.y + 60;
        
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
