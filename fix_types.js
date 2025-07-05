const fs = require('fs');
const path = require('path');

const filePath = '/Users/sreejesh/Documents/Projects/adya_mcp_hackathon/mcp_servers/js/servers/RANCHER/src/index.ts';
let content = fs.readFileSync(filePath, 'utf8');

// Fix all makeRancherRequest calls without type parameters
const fixes = [
  {
    search: 'const response = await makeRancherRequest({',
    replace: 'const response = await makeRancherRequest<RancherAPIResponse<any>>({'
  },
  {
    search: 'const cluster = await makeRancherRequest({',
    replace: 'const cluster = await makeRancherRequest<RancherCluster>({'
  },
  {
    search: 'const nodes = await makeRancherRequest({',
    replace: 'const nodes = await makeRancherRequest<RancherAPIResponse<RancherNode>>({'
  },
  {
    search: 'const projects = await makeRancherRequest({',
    replace: 'const projects = await makeRancherRequest<RancherAPIResponse<RancherProject>>({'
  },
  {
    search: 'const namespaces = await makeRancherRequest({',
    replace: 'const namespaces = await makeRancherRequest<RancherAPIResponse<RancherNamespace>>({'
  },
  {
    search: 'const workloads = await makeRancherRequest({',
    replace: 'const workloads = await makeRancherRequest<RancherAPIResponse<RancherWorkload>>({'
  },
  // Fix map functions with implicit any
  {
    search: '.map(claim =>',
    replace: '.map((claim: any) =>'
  },
  {
    search: '.map(cert =>',
    replace: '.map((cert: any) =>'
  },
  {
    search: '.map(alert =>',
    replace: '.map((alert: any) =>'
  },
  {
    search: '.map(node =>',
    replace: '.map((node: any) =>'
  },
  {
    search: '.map(backup =>',
    replace: '.map((backup: any) =>'
  },
  {
    search: '.map(catalog =>',
    replace: '.map((catalog: any) =>'
  },
  {
    search: '.map(app =>',
    replace: '.map((app: any) =>'
  },
  {
    search: '.map(policy =>',
    replace: '.map((policy: any) =>'
  },
  {
    search: '.map(sc =>',
    replace: '.map((sc: any) =>'
  },
  {
    search: '.map(quota =>',
    replace: '.map((quota: any) =>'
  },
  {
    search: '.map(hpa =>',
    replace: '.map((hpa: any) =>'
  },
  {
    search: '.map(volume =>',
    replace: '.map((volume: any) =>'
  },
  // Fix filter and reduce functions
  {
    search: '.filter(node => node.state',
    replace: '.filter((node: any) => node.state'
  },
  {
    search: '.filter(w => w.state',
    replace: '.filter((w: any) => w.state'
  },
  {
    search: '.reduce((sum, w) => sum',
    replace: '.reduce((sum: number, w: any) => sum'
  }
];

// Apply fixes
fixes.forEach(fix => {
  content = content.replace(new RegExp(fix.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), fix.replace);
});

// Write the fixed content back
fs.writeFileSync(filePath, content);
console.log('Fixed TypeScript errors in', filePath);
