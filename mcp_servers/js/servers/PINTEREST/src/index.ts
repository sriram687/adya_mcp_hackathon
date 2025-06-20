#!/usr/bin/env node

import {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js';
import {StdioServerTransport} from '@modelcontextprotocol/sdk/server/stdio'
import {getBoardsTool} from './tools/getBoards.js';

const server= new McpServer({
    name:"Pinterest",
    version:"1.0.0",
    capabilities:{
        tools:{
        [getBoardsTool.name]:{
            description:getBoardsTool.description,
            inputSchema:getBoardsTool.inputSchema,
            execute:getBoardsTool.execute,
        },
    },
}

});

async function main(){

    try{
        
        const transport =new StdioServerTransport();
        await server.connect(transport);
        
        console.log(`Server connected ${server.isConnected}`);
    }
    catch(error : any){
        console.error("Fatal error in main()",error.message);
        process.exit(1);
    }


}

main();

