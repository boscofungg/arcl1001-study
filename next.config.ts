import type { NextConfig } from 'next';
const config:NextConfig={agentRules:false,outputFileTracingIncludes:{'/api/chat':['./public/materials/**/*']}};
export default config;
