/**
 * parseFaqTxt.js — Parses FAQ.txt into structured FAQ data
 *
 * Answer formats in FAQ.txt:
 *   - "§ Answer text"          — standalone answer line (sections 1-6, 8, 9, 11+)
 *   - "Q.M Question?  Answer"  — answer on same line as question (sections 7, 10)
 */

const fs = require('fs');
const path = require('path');

function parseFAQtxt() {
  const content = fs.readFileSync(path.join(__dirname, '../../FAQ.txt'), 'utf8');

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

    // Section heading: "N. Title" or "N. Title §"  (N = 1 or 2 digits)
    const secMatch = line.match(/^(\d+)\.\s+(.+?)(?:\s*§)?\s*$/);
    if (secMatch) {
      if (currentSection) sections.push(currentSection);
      currentSection = {
        number: parseInt(secMatch[1]),
        title: secMatch[2].trim(),
        questions: []
      };
      continue;
    }

    // Question line: "D.M Question?" — find ALL question refs in the line
    // (handles concatenated "D.M?...D.M?..." on one line)
    // Greedy .+ captures the full text; $ anchor forces match to consume to end of string,
    // so for "1.1 Q1? Answer" the match fails (text continues after ?), but
    // for "1.1 Q1?...1.2 Q2?...1.3 Q3?" the greedy .+ goes all the way to the last ?
    // and then we use lastIndexOf to split each D.M question correctly
    const questionPattern = /(\d+)\.(\d+)\s+(.+?)\?/g;
    let match;
    while ((match = questionPattern.exec(line)) !== null) {
      if (currentSection) {
        currentSection.questions.push({
          id: `${match[1]}.${match[2]}`,
          question: match[3].trim()
        });
      }
    }
  }
  if (currentSection) sections.push(currentSection);

  // === Parse QA answers ===
  // Two formats:
  //  1. "D.M Question?\n§ Answer"           — dedicated answer line (old format)
  //  2. "D.M Question?  Answer on same line" — inline answer (new format, sections 7 & 10)
  const qaLines = qaSection.split(/\r?\n/);
  const answerMap = {};
  let currentQId = null;
  let currentAnswer = [];

  for (const rawLine of qaLines) {
    const line = rawLine.trim();
    if (!line) continue;

    // New format: answer follows "?" with 2+ spaces on the same line (no § prefix)
    const inlineMatch = line.match(/^(\d+)\.(\d+)\s+(.+?\?)\s{2,}(.+)/);
    if (inlineMatch) {
      if (currentQId && currentAnswer.length > 0) {
        answerMap[currentQId] = currentAnswer.join(' ').replace(/\s+/g, ' ').trim();
      }
      currentQId = `${inlineMatch[1]}.${inlineMatch[2]}`;
      currentAnswer = [inlineMatch[4].trim()];
      continue;
    }

    // Standard question line
    const qMatch = line.match(/^(\d+)\.(\d+)\s+(.+)/);
    if (qMatch) {
      if (currentQId && currentAnswer.length > 0) {
        answerMap[currentQId] = currentAnswer.join(' ').replace(/\s+/g, ' ').trim();
      }
      currentQId = `${qMatch[1]}.${qMatch[2]}`;
      const text = qMatch[3];
      // Check for inline answer: "Question?  Answer" (answer after ? on same line)
      const questionMarkIdx = text.indexOf('?');
      if (questionMarkIdx !== -1 && questionMarkIdx < text.length - 1) {
        const potentialAnswer = text.substring(questionMarkIdx + 1).trim();
        if (potentialAnswer) {
          answerMap[currentQId] = potentialAnswer;
          currentQId = null;
          currentAnswer = [];
          continue;
        }
      }
      currentAnswer = [];
      continue;
    }

    // Old format: standalone answer line starting with "§ "
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

module.exports = parseFAQtxt;