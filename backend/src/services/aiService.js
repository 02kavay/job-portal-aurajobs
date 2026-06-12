/**
 * AI Recommendation & Matching Service
 * Uses Natural Language Processing (NLP) heuristics:
 * 1. Skill Matching Ratio (40% weight) - checks overlap of required vs. candidate skills.
 * 2. Title & Context Content Cosine Similarity (35% weight) - uses TF vector representations.
 * 3. Experience Match Factor (25% weight) - evaluates candidate experience years against job requirements.
 */

const STOP_WORDS = new Set([
  'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and', 'any', 'are', 'arent',
  'as', 'at', 'be', 'because', 'been', 'before', 'being', 'below', 'between', 'both', 'but', 'by',
  'cant', 'cannot', 'could', 'couldnt', 'did', 'didnt', 'do', 'does', 'doesnt', 'doing', 'dont',
  'down', 'during', 'each', 'few', 'for', 'from', 'further', 'had', 'hadnt', 'has', 'hasnt', 'have',
  'havent', 'having', 'he', 'hed', 'hell', 'hes', 'her', 'here', 'heres', 'hers', 'herself', 'him',
  'himself', 'his', 'how', 'hows', 'i', 'id', 'im', 'ive', 'if', 'in', 'into', 'is', 'isnt', 'it',
  'its', 'itself', 'lets', 'me', 'more', 'most', 'mustnt', 'my', 'myself', 'no', 'nor', 'not', 'of',
  'off', 'on', 'once', 'only', 'or', 'other', 'ought', 'our', 'ours', 'ourselves', 'out', 'over',
  'own', 'same', 'shant', 'she', 'shed', 'shell', 'shes', 'should', 'shouldnt', 'so', 'some', 'such',
  'than', 'that', 'thats', 'the', 'their', 'theirs', 'them', 'themselves', 'then', 'there', 'theres',
  'these', 'they', 'theyd', 'theyll', 'theyre', 'theyve', 'this', 'those', 'through', 'to', 'too',
  'under', 'until', 'up', 'very', 'was', 'wasnt', 'we', 'wed', 'well', 'were', 'weve', 'werent',
  'what', 'whats', 'when', 'whens', 'where', 'wheres', 'which', 'while', 'who', 'whos', 'whom',
  'why', 'whys', 'with', 'wont', 'would', 'wouldnt', 'you', 'youd', 'youll', 'youre', 'youve',
  'your', 'yours', 'yourself', 'yourselves'
]);

/**
 * Tokenize, lowercase and remove stop words from a text string.
 */
function preprocessText(text) {
  if (!text) return [];
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ') // Replace punctuation with space
    .split(/\s+/)
    .filter(word => word.length > 1 && !STOP_WORDS.has(word));
}

/**
 * Calculate Cosine Similarity between two term frequency vectors.
 */
function calculateCosineSimilarity(vec1, vec2) {
  let dotProduct = 0;
  let magnitude1 = 0;
  let magnitude2 = 0;

  // Find all unique terms
  const terms = new Set([...Object.keys(vec1), ...Object.keys(vec2)]);

  for (const term of terms) {
    const val1 = vec1[term] || 0;
    const val2 = vec2[term] || 0;
    dotProduct += val1 * val2;
    magnitude1 += val1 * val1;
    magnitude2 += val2 * val2;
  }

  magnitude1 = Math.sqrt(magnitude1);
  magnitude2 = Math.sqrt(magnitude2);

  if (magnitude1 === 0 || magnitude2 === 0) return 0;
  return dotProduct / (magnitude1 * magnitude2);
}

/**
 * Convert token array to term frequency dictionary.
 */
function getTermFrequencies(tokens) {
  const freqs = {};
  for (const token of tokens) {
    freqs[token] = (freqs[token] || 0) + 1;
  }
  return freqs;
}

/**
 * Parse lists of skills.
 */
function parseSkills(skillsString) {
  if (!skillsString) return [];
  return skillsString
    .split(',')
    .map(s => s.trim().toLowerCase())
    .filter(s => s.length > 0);
}

/**
 * Core matching function. Computes a match score from 0 to 100 and builds an explanation.
 */
export function computeMatchScore(profile, job) {
  // 1. SKILLS MATCH (40% Weight)
  const jobSkills = parseSkills(job.requirements);
  const seekerSkills = parseSkills(profile.skills);
  
  let skillScore = 100;
  let matchedSkills = [];
  let missingSkills = [];

  if (jobSkills.length > 0) {
    matchedSkills = jobSkills.filter(js => 
      seekerSkills.some(ss => ss === js || ss.includes(js) || js.includes(ss))
    );
    missingSkills = jobSkills.filter(js => !matchedSkills.includes(js));
    skillScore = Math.round((matchedSkills.length / jobSkills.length) * 100);
  }

  // 2. TEXT/KEYWORD MATCH (35% Weight)
  // Candidate representation: Title, Bio, and Education
  const candidateText = `${profile.title || ''} ${profile.bio || ''} ${profile.education || ''}`;
  // Job representation: Title, Description
  const jobText = `${job.title} ${job.description}`;

  const candidateTokens = preprocessText(candidateText);
  const jobTokens = preprocessText(jobText);

  const candidateFreqs = getTermFrequencies(candidateTokens);
  const jobFreqs = getTermFrequencies(jobTokens);

  const cosineSimilarity = calculateCosineSimilarity(candidateFreqs, jobFreqs);
  const keywordScore = Math.round(cosineSimilarity * 100);

  // 3. EXPERIENCE MATCH (25% Weight)
  let experienceScore = 100;
  const reqExp = job.experienceRequired || 0;
  const candExp = profile.experienceYears || 0;

  if (reqExp > 0) {
    if (candExp >= reqExp) {
      experienceScore = 100;
    } else {
      experienceScore = Math.round((candExp / reqExp) * 100);
    }
  }

  // Calculate Weighted Total Score
  const totalScore = Math.round(
    (skillScore * 0.40) +
    (keywordScore * 0.35) +
    (experienceScore * 0.25)
  );

  // Build a nice explanation
  const matchedSkillsText = matchedSkills.length > 0 
    ? `Matches skills: ${matchedSkills.join(', ')}`
    : 'No direct skill matches found';
  const missingSkillsText = missingSkills.length > 0
    ? `Missing recommended skills: ${missingSkills.join(', ')}`
    : 'Covers all required skills';
  
  const expText = candExp >= reqExp
    ? `Meets experience requirement (${candExp} yrs >= ${reqExp} yrs)`
    : `Experience discrepancy (${candExp} yrs vs ${reqExp} yrs required)`;

  const explanation = `${matchedSkillsText}. ${missingSkillsText}. ${expText}. Overall contextual similarity matches at ${keywordScore}%.`;

  return {
    score: Math.min(100, Math.max(0, totalScore)),
    skillScore,
    keywordScore,
    experienceScore,
    explanation,
    matchedSkills,
    missingSkills
  };
}

/**
 * Score and sort a list of jobs for a candidate profile.
 */
export function rankJobsForProfile(profile, jobs) {
  return jobs
    .map(job => {
      const match = computeMatchScore(profile, job);
      return {
        ...job,
        aiMatch: match
      };
    })
    .sort((a, b) => b.aiMatch.score - a.aiMatch.score);
}

/**
 * Score and sort a list of applicant profiles for a job.
 */
export function rankApplicantsForJob(profiles, job) {
  return profiles
    .map(profile => {
      const match = computeMatchScore(profile, job);
      return {
        ...profile,
        aiMatch: match
      };
    })
    .sort((a, b) => b.aiMatch.score - a.aiMatch.score);
}
