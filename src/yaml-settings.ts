import { Event } from './calendar';
import { parseDatePattern } from './datepattern';
import {Query,FileQuery,ListQuery,TaskQuery} from './query';

// This file contains functions to parse event extractors
// for various kinds of queries. The syntax of the settings block
// is YAML, and it is structured as in the example below:
//
// queries:
//    - FileQuery:
//        when:
//          - match: "\d\d\d\d-\d\d-\d\d"
//          - match: "(\d\d)/(\d\d)/(\d\d\d\d)"
//            replace: "$3-$1-$2"
//        root: "projects/school/grading"
//        display:
//          extract: ["frontmatter.title", "name"]
//            - match: "#hw"
//              replace: ""
//            - match: "\s*DUE DATE\s*"
//              replace: ""
//    - TaskQuery:
//        completed: false
//        when:
//          - match: "\d\d\d\d-\d\d-\d\d"
//          - match: "(\d\d)/(\d\d)/(\d\d\d\d)"
//            replace: "$3-$1-$2"
//        root: "projects/school/grading"
//        display:
//          extract: "text"
//            - match: "#hw"
//            - replace: ""


export interface TextReplacement {
  pattern: RegExp;
  replacement: string;
}

export interface EventExtractorConfig {
  // Where to search in the input data (dot-notation path)
  searchPath?: string;
  
  // String patterns to match (will be converted to RegExp)
  matchPatterns?: string[];
  
  // Regular expressions for text replacement before creating events
  textReplacements?: TextReplacement[];
  
  // How to extract the date from matched text
  datePattern?: RegExp;
  
  // How to extract the display text from matched text
  displayPattern?: RegExp;
  
  // How to extract the link from matched text
  linkPattern?: RegExp;
  
  // List of keys to extract text from (dot-notation paths)
  extractorKeys?: string[];
}

export class EventExtractor {
  private config: EventExtractorConfig;
  private matchRegexes: RegExp[];
  private extractorKeys: string[];

  constructor(config: EventExtractorConfig) {
    this.config = config;
    this.matchRegexes = (config.matchPatterns || []).map(pattern => new RegExp(pattern, 'i'));
    this.extractorKeys = config.extractorKeys || ['text', 'content', 'title', 'name', 'description'];
  }

  /**
   * Extract events from input data based on the configured patterns
   */
  extractEvents(data: any): Event[] {
    const events: Event[] = [];
    const searchData = this.getSearchData(data);
    
    if (!searchData) {
      return events;
    }

    // Convert searchData to array of strings to process
    const textItems = this.getTextItems(searchData);
    
    for (const text of textItems) {
      if (this.matchesPatterns(text)) {
        const processedText = this.applyTextReplacements(text);
        const event = this.createEventFromText(processedText);
        if (event) {
          events.push(event);
        }
      }
    }

    return events;
  }

  /**
   * Navigate to the specified search path in the data object
   */
  private getSearchData(data: any): any {
    if (!this.config.searchPath) {
      return data;
    }

    const pathParts = this.config.searchPath.split('.');
    let current = data;
    
    for (const part of pathParts) {
      if (current && typeof current === 'object' && part in current) {
        current = current[part];
      } else {
        return null;
      }
    }
    
    return current;
  }

  /**
   * Convert search data to array of strings for processing
   */
  private getTextItems(searchData: any): string[] {
    if (typeof searchData === 'string') {
      return [searchData];
    }
    
    if (Array.isArray(searchData)) {
      return searchData.flatMap(item => this.getTextItems(item));
    }
    
    if (searchData && typeof searchData === 'object') {
      const texts: string[] = [];
      
      for (const key of this.extractorKeys) {
        const value = this.extractValueByPath(searchData, key);
        if (typeof value === 'string') {
          texts.push(value);
        }
      }
      
      return texts;
    }
    
    return [];
  }

  /**
   * Check if text matches any of the configured patterns
   */
  private matchesPatterns(text: string): boolean {
    if (this.matchRegexes.length === 0) {
      return true; // If no patterns specified, match everything
    }
    
    return this.matchRegexes.some(regex => regex.test(text));
  }

  /**
   * Apply configured text replacements to the input text
   */
  private applyTextReplacements(text: string): string {
    let result = text;
    
    for (const replacement of this.config.textReplacements || []) {
      result = result.replace(replacement.pattern, replacement.replacement);
    }
    
    return result;
  }

  /**
   * Create an Event object from processed text
   */
  private createEventFromText(text: string): Event | null {
    const dateStr = this.extractWithPattern(text, this.config.datePattern);
    const display = this.extractWithPattern(text, this.config.displayPattern) || text;
    const link = this.extractWithPattern(text, this.config.linkPattern) || '';

    if (!dateStr) {
      return null;
    }

    const datePattern = parseDatePattern(dateStr);
    if (!datePattern) {
      return null;
    }

    return {
      when: datePattern,
      display: display,
      link: link
    };
  }

  /**
   * Extract text using a regular expression pattern
   */
  private extractWithPattern(text: string, pattern?: RegExp): string | null {
    if (!pattern) {
      return null;
    }

    const match = pattern.exec(text);
    if (match) {
      // Return named capture group 'extract' if it exists, otherwise return first capture group
      return match.groups?.extract || match[1] || match[0];
    }

    return null;
  }
}
