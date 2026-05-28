/**
 * parseFaqTxt.js — Parses FAQ.txt into structured FAQ data
 * 
 * FAQ.txt format:
 *   - TOC: questions can be concatenated without newlines (e.g. "1.1...?1.2...?")
 *   - QA section: "N.M Question?" followed by "§ Answer text"
 */

const fs = require('fs');
const path = require('path');

function parseFAQtxt() {
  const content = fs.readFileSync(path.join(__dirname, '../../FAQ.txt'), 'utf8');

  // The TOC/QA separator
  const qaSeparator = '============QA=======================================QA=================================================QA===========================================QA==============';
  const parts = content.split(qaSeparator);
  
  const tocSection = parts[0];
  const qaSection = parts[1];

  // === Parse TOC ===
  const tocLines = tocSection.split(/\r?\n/);

  const sections = [];
  let currentSection = null;

  for (const rawLine of tocLines) {
    const line = rawLine.trim();
    if (!line) continue;

    const isQuestionLine = /^\d+\.\d+/.test(line);

    if (!isQuestionLine) {
      const secMatch = line.match(/^(\d+)\.\s+(.+)/);
      if (secMatch) {
        if (currentSection) sections.push(currentSection);
        currentSection = {
          number: parseInt(secMatch[1]),
          title: secMatch[2].trim(),
          questions: []
        };
      }
    } else {
      const questions = splitConcatenatedQuestions(line);
      for (const q of questions) {
        const parts = q.match(/^(\d+)\.(\d+)\s+(.+)/);
        if (parts && currentSection) {
          currentSection.questions.push({
            id: `${parts[1]}.${parts[2]}`,
            question: parts[3].trim()
          });
        }
      }
    }
  }
  if (currentSection) sections.push(currentSection);

  // === Parse QA answers ===
  const qaLines = qaSection.split(/\r?\n/);
  const answerMap = {};
  let currentQId = null;
  let currentAnswer = [];

  for (const rawLine of qaLines) {
    const line = rawLine.trim();
    if (!line) continue;

    const qMatch = line.match(/^(\d+)\.(\d+)\s+(.+)/);
    if (qMatch) {
      if (currentQId && currentAnswer.length > 0) {
        answerMap[currentQId] = currentAnswer.join(' ').replace(/\s+/g, ' ').trim();
      }
      currentQId = `${qMatch[1]}.${qMatch[2]}`;
      currentAnswer = [];
      continue;
    }

    if (line.startsWith('§ ')) {
      const answerText = line.substring(2).trim();
      if (answerText) currentAnswer.push(answerText);
    }
  }
  if (currentQId && currentAnswer.length > 0) {
    answerMap[currentQId] = currentAnswer.join(' ').replace(/\s+/g, ' ').trim();
  }

  // === Combine into FAQ list ===
  const faqs = [];
  for (const section of sections) {
    const sectionTag = section.title.toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 30);

    for (const q of section.questions) {
      const answer = answerMap[q.id];
      if (answer) {
        faqs.push({
          sectionNumber: section.number,
          sectionTitle: section.title,
          questionId: q.id,
          title: q.question,
          description: q.question,
          finalAnswer: answer,
          tags: [sectionTag, q.id]
        });
      }
    }
  }

  return { sections, faqs, answerMap };
}

function splitConcatenatedQuestions(line) {
  // Split on D.D boundaries and reassemble
  const segments = line.split(/(?=\d+\.\d+)/);
  const results = [];
  for (const seg of segments) {
    const trimmed = seg.trim();
    if (trimmed.match(/^\d+\.\d+/)) {
      results.push(trimmed);
    } else if (results.length > 0) {
      results[results.length - 1] += ' ' + trimmed;
    }
  }
  return results;
}

module.exports = parseFAQtxt;