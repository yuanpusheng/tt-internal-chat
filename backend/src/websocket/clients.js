const clients = new Map();

function generateUniqueId() {
    return 'user_' + Math.random().toString(36).substr(2, 9);
}

function getClientInfo(ws) {
    return clients.get(ws);
}

function addClient(ws, clientId) {
    console.log('Adding client:', clientId);
    const existingName = Array.from(clients.values())
        .find(client => client.id === clientId)?.name;
    
    clients.set(ws, {
        id: clientId,
        name: existingName || `用户${clientId.substr(5, 4)}`,
        status: 'online'
    });
}

function removeClient(ws) {
    console.log('Removing client:', getClientInfo(ws)?.id);
    clients.delete(ws);
}

function updateClientName(ws, newName) {
    const client = clients.get(ws);
    if (client) {
        client.name = newName;
        console.log('Updated client name:', client.id, 'to:', newName);
    }
}

function getAllClients() {
    const clientList = Array.from(clients.values()).map(client => ({
        id: client.id,
        name: client.name,
        status: 'online'
    }));
    console.log('Current client list:', clientList);
    return clientList;
}

module.exports = {
    generateUniqueId,
    getClientInfo,
    addClient,
    removeClient,
    updateClientName,
    getAllClients
}; 