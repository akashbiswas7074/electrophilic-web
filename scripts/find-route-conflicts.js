// Run this script with: node scripts/find-route-conflicts.js

const fs = require('fs');
const path = require('path');

// Function to recursively find all files in directory
function findFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      // Skip node_modules and .next directories
      if (file !== 'node_modules' && file !== '.next') {
        findFiles(filePath, fileList);
      }
    } else {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

// Get all files in the app directory
const appFiles = findFiles(path.join(__dirname, '..', 'app'));
const pagesFiles = findFiles(path.join(__dirname, '..', 'pages'));
const allFiles = [...appFiles, ...pagesFiles];

// Find files with dynamic segments in their names
const dynamicRouteFiles = allFiles.filter(file => {
  const fileName = path.basename(file);
  return fileName.includes('[') && fileName.includes(']');
});

// Extract the dynamic parameter names and file paths
const dynamicParams = dynamicRouteFiles.map(file => {
  const relativePath = path.relative(path.join(__dirname, '..'), file);
  const fileName = path.basename(file);
  const match = fileName.match(/\[(.*?)\]/);
  const paramName = match ? match[1] : null;
  
  return {
    path: relativePath,
    paramName
  };
});

// Group routes by their path pattern to find conflicts
const routeMap = {};

dynamicParams.forEach(({ path, paramName }) => {
  // Create a generic path by replacing the parameter name with a placeholder
  const genericPath = path.replace(/\[.*?\]/, '[PARAM]');
  
  if (!routeMap[genericPath]) {
    routeMap[genericPath] = [];
  }
  
  routeMap[genericPath].push({ path, paramName });
});

// Find conflicts where the same route pattern uses different parameter names
console.log('ROUTE CONFLICTS:');
let conflictsFound = false;

for (const [pattern, routes] of Object.entries(routeMap)) {
  const paramNames = routes.map(route => route.paramName);
  const uniqueParams = [...new Set(paramNames)];
  
  if (uniqueParams.length > 1) {
    conflictsFound = true;
    console.log(`\nConflict in route pattern: ${pattern}`);
    console.log('Routes with different parameter names:');
    
    routes.forEach(route => {
      console.log(`  - ${route.path} (param: ${route.paramName})`);
    });
  }
}

if (!conflictsFound) {
  console.log('No conflicts found.');
}

// Recommend standardizing on 'slug'
console.log('\nRECOMMENDATION:');
console.log('Standardize all dynamic route parameters to use "slug" for consistency.');
console.log('Files to rename:');

dynamicParams.forEach(({ path, paramName }) => {
  if (paramName !== 'slug') {
    const directory = path.substring(0, path.lastIndexOf('/'));
    const fileName = path.substring(path.lastIndexOf('/') + 1);
    const newFileName = fileName.replace(`[${paramName}]`, '[slug]');
    console.log(`  - ${path} → ${directory}/${newFileName}`);
  }
});
