import fs from 'fs';
import pdf from 'pdf-parse';

// Common technical skills to search for
const COMMON_SKILLS = [
  'javascript', 'typescript', 'react', 'next.js', 'vue', 'angular', 'svelte',
  'node.js', 'node', 'express', 'nest.js', 'django', 'flask', 'fastapi', 'spring boot', 'laravel',
  'postgresql', 'postgres', 'mysql', 'sqlite', 'mongodb', 'redis', 'dynamodb', 'cassandra', 'sql',
  'python', 'java', 'c++', 'c#', 'golang', 'ruby', 'php', 'rust', 'swift', 'kotlin',
  'docker', 'kubernetes', 'aws', 'azure', 'gcp', 'firebase', 'git', 'github', 'jenkins', 'ci/cd',
  'html', 'css', 'sass', 'tailwind', 'bootstrap', 'graphql', 'rest api', 'microservices',
  'machine learning', 'deep learning', 'nlp', 'data science', 'ai', 'analytics', 'agile', 'scrum'
];

// Helper to calculate experience from text
function extractExperience(text) {
  // Try to find phrases like "5 years of experience", "3+ years", etc.
  const expRegexes = [
    /(\d+)\+?\s*years?\s+(?:of\s+)?experience/i,
    /experience\s*:\s*(\d+)\+?\s*years?/i,
    /(\d+)\s*yrs?\s+exp/i
  ];

  for (const regex of expRegexes) {
    const match = text.match(regex);
    if (match && match[1]) {
      const years = parseInt(match[1], 10);
      if (!isNaN(years) && years > 0 && years < 50) {
        return years;
      }
    }
  }

  // Heuristic: Count dates and approximate
  // (e.g. 2018 - 2022 -> 4 years)
  const dateRegex = /\b(19\d{2}|20\d{2})\s*[-–—]\s*(current|present|19\d{2}|20\d{2})\b/gi;
  let matches;
  let totalYears = 0;
  while ((matches = dateRegex.exec(text)) !== null) {
    const start = parseInt(matches[1], 10);
    const endStr = matches[2].toLowerCase();
    const end = (endStr === 'current' || endStr === 'present')
      ? new Date().getFullYear()
      : parseInt(endStr, 10);
    
    if (end >= start) {
      totalYears += (end - start);
    }
  }

  return totalYears > 0 ? Math.min(30, totalYears) : 1; // Default fallback to 1 year if we see resume date overlaps, or 0
}

function extractEmail(text) {
  const emailRegex = /[\w.-]+@[\w.-]+\.[\w.-]+/g;
  const match = text.match(emailRegex);
  return match ? match[0] : null;
}

function extractPhone(text) {
  // Matches various formats: +1-234-567-8901, (123) 456-7890, 1234567890
  const phoneRegex = /(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g;
  const match = text.match(phoneRegex);
  return match ? match[0] : null;
}

function extractSkills(text) {
  const textLower = text.toLowerCase();
  const matchedSkills = [];

  for (const skill of COMMON_SKILLS) {
    // Escape special regex chars like . or + (e.g. next.js, c++)
    const escaped = skill.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    // Ensure word boundaries or specific syntax (e.g. c++ can be followed by spaces)
    const regex = new RegExp(`\\b${escaped}\\b`, 'i');
    
    // Custom check for C++ since word boundary \b doesn't match after +
    if (skill === 'c++') {
      if (textLower.includes('c++')) {
        matchedSkills.push('C++');
      }
    } else if (skill === 'next.js') {
      if (textLower.includes('next.js') || textLower.includes('nextjs')) {
        matchedSkills.push('Next.js');
      }
    } else if (skill === 'node.js') {
      if (textLower.includes('node.js') || textLower.includes('nodejs') || textLower.includes('node ')) {
        matchedSkills.push('Node.js');
      }
    } else if (regex.test(textLower)) {
      // Capitalize first letter of skill for clean output
      const formattedSkill = skill
        .split(' ')
        .map(w => w === 'ai' ? 'AI' : w === 'aws' ? 'AWS' : w === 'gcp' ? 'GCP' : w === 'rest api' ? 'REST API' : w === 'ci/cd' ? 'CI/CD' : w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');
      matchedSkills.push(formattedSkill);
    }
  }

  return [...new Set(matchedSkills)]; // unique
}

function extractTitle(text) {
  // Look for common titles in the first few lines of text
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0).slice(0, 10);
  const titles = [
    'software engineer', 'frontend developer', 'backend developer', 'full stack developer',
    'web developer', 'data scientist', 'product manager', 'project manager', 'devops engineer',
    'system administrator', 'ui/ux designer', 'mobile developer', 'android developer', 'ios developer'
  ];

  for (const line of lines) {
    const lineLower = line.toLowerCase();
    for (const title of titles) {
      if (lineLower.includes(title)) {
        // Return capitalized title
        return title.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      }
    }
  }
  
  return 'Professional'; // Default fallback
}

function extractEducation(text) {
  const lines = text.split('\n');
  const eduKeywords = ['university', 'college', 'institute', 'degree', 'bachelor', 'master', 'phd', 'b.s', 'm.s', 'b.tech', 'm.tech', 'bca', 'mca', 'bsc', 'msc'];
  
  // Find lines containing education keywords
  const eduLines = [];
  for (const line of lines) {
    const lineLower = line.toLowerCase();
    if (eduKeywords.some(keyword => lineLower.includes(keyword))) {
      eduLines.push(line.trim());
    }
  }

  return eduLines.slice(0, 2).join(', ') || 'Higher Education';
}

function extractName(text) {
  // Typically, name is on the first 2-3 lines of a resume.
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0).slice(0, 3);
  if (lines.length > 0) {
    // If first line contains email or phone, skip it.
    for (const line of lines) {
      if (!line.includes('@') && !line.match(/\d{4,}/) && line.split(' ').length <= 4) {
        return line;
      }
    }
  }
  return 'Applicant Name';
}

/**
 * Main parser function
 */
export async function parseResumeFile(filePath, mimeType) {
  try {
    let text = '';
    
    if (mimeType === 'application/pdf') {
      const dataBuffer = fs.readFileSync(filePath);
      const data = await pdf(dataBuffer);
      text = data.text;
    } else {
      // Assume txt or other text format
      text = fs.readFileSync(filePath, 'utf-8');
    }

    if (!text || text.trim().length === 0) {
      throw new Error('No readable text found in resume.');
    }

    const name = extractName(text);
    const email = extractEmail(text);
    const phone = extractPhone(text);
    const title = extractTitle(text);
    const skills = extractSkills(text);
    const experienceYears = extractExperience(text);
    const education = extractEducation(text);

    return {
      success: true,
      data: {
        fullName: name,
        email,
        phone,
        title,
        skills: skills.join(', '),
        experienceYears,
        education,
        bio: `Experienced ${title} with key strengths in: ${skills.slice(0, 5).join(', ')}.`
      }
    };
  } catch (error) {
    console.error('Error parsing resume:', error);
    return {
      success: false,
      error: error.message
    };
  }
}
