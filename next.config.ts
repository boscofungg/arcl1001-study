import type { NextConfig } from 'next';
const config:NextConfig={agentRules:false,async redirects(){return [{source:'/expeditions',destination:'/?view=practice',permanent:false}];},outputFileTracingIncludes:{'/api/chat':['./public/materials/**/*']}};
export default config;
