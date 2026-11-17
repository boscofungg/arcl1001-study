import type { NextConfig } from 'next';
const config:NextConfig={agentRules:false,async headers(){return [{source:'/materials/:path*',headers:[{key:'X-Robots-Tag',value:'noindex, nofollow, noimageindex'}]},{source:'/api/:path*',headers:[{key:'X-Robots-Tag',value:'noindex, nofollow'}]}];},async redirects(){return [{source:'/expeditions',destination:'/?view=practice',permanent:false}];},outputFileTracingIncludes:{'/api/chat':['./public/materials/**/*']}};
export default config;
