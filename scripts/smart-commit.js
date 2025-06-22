#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * Smart Git Commit for Studio Log Updates
 * Analyzes changes and creates meaningful commit messages
 */

function runCommand(command, options = {}) {
  try {
    const result = execSync(command, { 
      encoding: 'utf8', 
      stdio: options.silent ? 'pipe' : 'inherit',
      ...options 
    });
    return result ? result.trim() : '';
  } catch (error) {
    if (!options.allowFailure) {
      console.error(`❌ Command failed: ${command}`);
      console.error(error.message);
      process.exit(1);
    }
    return '';
  }
}

function getGitStatus() {
  const status = runCommand('git status --porcelain', { silent: true });
  return status.split('\n').filter(line => line.trim());
}

function analyzeChanges() {
  const changes = getGitStatus();
  
  const analysis = {
    newPosts: 0,
    modifiedPosts: 0,
    deletedPosts: 0,
    assetChanges: 0,
    configChanges: 0,
    otherChanges: 0,
    files: []
  };

  changes.forEach(line => {
    const [status, filePath] = [line.substring(0, 2), line.substring(3)];
    analysis.files.push({ status, filePath });

    if (filePath.startsWith('content/') && filePath.endsWith('.md')) {
      if (status.includes('A')) analysis.newPosts++;
      else if (status.includes('M')) analysis.modifiedPosts++;
      else if (status.includes('D')) analysis.deletedPosts++;
    } else if (filePath.startsWith('public/') || filePath.includes('assets')) {
      analysis.assetChanges++;
    } else if (filePath.includes('config') || filePath.includes('package.json')) {
      analysis.configChanges++;
    } else {
      analysis.otherChanges++;
    }
  });

  return analysis;
}

function generateCommitMessage(analysis) {
  const { newPosts, modifiedPosts, deletedPosts, assetChanges } = analysis;
  const date = new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });

  // Primary message based on main changes
  let primaryMsg = '';
  let details = [];

  if (newPosts > 0) {
    primaryMsg = `📝 Add ${newPosts} new studio log ${newPosts === 1 ? 'post' : 'posts'}`;
  } else if (modifiedPosts > 0) {
    primaryMsg = `✏️  Update ${modifiedPosts} studio log ${modifiedPosts === 1 ? 'post' : 'posts'}`;
  } else if (deletedPosts > 0) {
    primaryMsg = `🗑️  Remove ${deletedPosts} studio log ${deletedPosts === 1 ? 'post' : 'posts'}`;
  } else if (assetChanges > 0) {
    primaryMsg = `🖼️  Update assets and media files`;
  } else {
    primaryMsg = `🔧 Update studio log configuration`;
  }

  // Add details for secondary changes
  if (newPosts > 0 && modifiedPosts > 0) {
    details.push(`${modifiedPosts} updated`);
  }
  if (deletedPosts > 0 && (newPosts > 0 || modifiedPosts > 0)) {
    details.push(`${deletedPosts} removed`);
  }
  if (assetChanges > 0 && (newPosts > 0 || modifiedPosts > 0)) {
    details.push(`${assetChanges} asset changes`);
  }

  // Build final message
  let commitMsg = primaryMsg;
  if (details.length > 0) {
    commitMsg += ` (${details.join(', ')})`;
  }
  commitMsg += `\n\nPublished: ${date}`;

  return commitMsg;
}

function hasChangesToCommit() {
  const status = getGitStatus();
  return status.length > 0;
}

function main() {
  console.log('🔍 Analyzing changes for smart commit...');

  if (!hasChangesToCommit()) {
    console.log('✅ No changes to commit');
    return;
  }

  const analysis = analyzeChanges();
  const commitMessage = generateCommitMessage(analysis);

  console.log('\n📋 Changes detected:');
  if (analysis.newPosts > 0) console.log(`  📝 ${analysis.newPosts} new posts`);
  if (analysis.modifiedPosts > 0) console.log(`  ✏️  ${analysis.modifiedPosts} modified posts`);
  if (analysis.deletedPosts > 0) console.log(`  🗑️  ${analysis.deletedPosts} deleted posts`);
  if (analysis.assetChanges > 0) console.log(`  🖼️  ${analysis.assetChanges} asset changes`);

  console.log('\n💬 Commit message:');
  console.log(`"${commitMessage.split('\n')[0]}"`);

  // Stage all changes
  console.log('\n📦 Staging changes...');
  runCommand('git add .');

  // Commit with generated message
  console.log('💾 Committing changes...');
  runCommand(`git commit -m "${commitMessage}"`);

  console.log('✅ Changes committed successfully!');
}

if (require.main === module) {
  main();
}

module.exports = { analyzeChanges, generateCommitMessage }; 