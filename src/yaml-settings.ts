import { parseYaml } from 'obsidian';
import Yaml from 'yaml';
import { Event } from './calendar';
import { parseDatePattern } from './datepattern';
import {Query,FileQuery,ListQuery,TaskQuery} from './query';
import { Result } from './result';

// This file contains functions to parse event extractors
// for various kinds of queries. The syntax of the settings block
// is YAML, and it is structured as in the example below:
//
// queries:
//    - Tasks:
//        pages: '"projects/school/grading"'
//        tasks:
//          - extract: ["completed"]
//            is: false
//          - extract: ["text"]
//            match: "\d\d\d\d-\d\d-\d\d" 
//        display:
//          extract: ["frontmatter.title", "name"]
//            - replace: "#hw"
//              replacement: ""
//            - replace: "\s*DUE DATE\s*"
//              replacement: ""


/**
 * Extracts a value from a nested object using a dotted key path.
 * Navigates through nested properties by splitting the key on dots.
 * Used by task matchers and display text extractors to access nested task properties.
 *
 * @param key - Dotted path to the property (e.g., "frontmatter.title")
 * @param value - The object to extract from
 * @returns The extracted value, or undefined if any part of the path doesn't exist
 */
export function extractKey(key:string,value:any):any {
  let parts = key.split('.').map((s)=>s.trim());
  let result = value;
  for(let part of parts) {
    result = result[part];
    if(typeof result === "undefined") {
      return undefined;
    }
  }
  return result;
}

/**
 * Tests whether a DataView task matches the given criteria.
 * Extracts values from the task using the matcher's keys and tests them against
 * the matcher's patterns. Returns true if ANY key/matcher combination matches.
 * Used by TaskQueryRunner to filter tasks based on YAML configuration.
 *
 * @param dvtask - The DataView task object to test
 * @param task_matcher - The matcher specification containing keys and patterns
 * @returns True if the task matches any of the criteria
 */
export function checkTaskMatcher(dvtask:any,task_matcher:KeyMatcher):boolean {
  for(let value of task_matcher.keys.map((k)=>extractKey(k,dvtask))) {
    if(typeof value !== 'undefined'){
      for(let matcher of task_matcher.matchers) {
        let match = false;
        if(matcher instanceof RegExp) {
          match = (''+value).match(matcher) && true;
        } else {
          match = (value == matcher)
        }
        if(match) { // early exit if ANY of them work
          return true;
        }
      }
    }
  }
  return false;
}

/**
 * Generates display text for a task by extracting values and applying replacements.
 * Extracts text from multiple keys, applies regex replacements to clean it up,
 * and combines everything into a single display string.
 * Used by TaskQueryRunner to format task text for calendar display.
 *
 * @param task - The DataView task object
 * @param replacers - Array of key extractors with their replacement rules
 * @returns The formatted display text for the task
 */
export function taskDisplayText(task:any, replacers: KeyReplacer[]):string {
  return replacers.flatMap((rpl)=>{
    // get all of the text for every key in the keys array
    let value = rpl.keys.map((k)=>extractKey(k,task)).join(' ');
    // For each replacer, run it globally
    for(let {replace,replacement} of rpl.replacers) {
      value.replaceAll(replace,replacement);
    }
  }).join(' '); // squash everything into a single string
}

/**
 * Specification for matching task properties.
 * Contains keys to extract from tasks and matchers to test against.
 * Used in YAML configuration to filter tasks.
 */
export interface KeyMatcher {
  /** Array of dotted paths to extract from tasks (e.g., ["text", "completed"]) */
  keys: string[],
  /** Array of values or patterns to match against (RegExp, boolean, or number) */
  matchers: (RegExp|boolean|number)[],
}

/**
 * Specification for extracting and formatting task display text.
 * Contains keys to extract and replacement rules to clean up the text.
 * Used in YAML configuration to format task display.
 */
export interface KeyReplacer {
  /** Array of dotted paths to extract text from (e.g., ["frontmatter.title", "text"]) */
  keys: string[],
  /** Array of regex replacement rules to apply to the extracted text */
  replacers: {replace:RegExp, replacement:string}[]
}

/**
 * Complete specification for a task query parsed from YAML.
 * Defines which pages to search, which tasks to include, and how to display them.
 * Used by TaskQueryRunner to execute queries and format results.
 */
export interface TaskQuerySpec {
  /** Optional DataView pages query to limit scope (e.g., "projects/school") */
  pages?: string,
  /** Array of matchers to filter which tasks to include */
  tasks: KeyMatcher[],
  /** Array of replacers to format task display text */
  display: KeyReplacer[],
}

/**
 * Parses a TaskQuerySpec from YAML configuration string.
 * Converts YAML into a structured task query specification.
 * Used by the calendar plugin to load task queries from code blocks.
 *
 * @param yaml_src - YAML string containing the task query configuration
 * @returns Result containing the parsed TaskQuerySpec or an Error if parsing fails
 */
export function taskQueryFromYaml(yaml_src:string) : Result<TaskQuerySpec,Error> {
  try {
    let attempt = Yaml.parse(yaml_src,null,{prettyErrors:true});
    console.log("Validating parsed data by prayer! Cross your fingers, because I'm not checking anything!");
    console.log(`Parsed yaml data: ${JSON.stringify(attempt)}`);
    return Result.Ok(attempt as TaskQuerySpec)
  }
  catch(e:any) {
    console.error(`VaultCalendar: Couldn't parse YAML input: ${e.name}:\n\t${e.message}`,e);
    return Result.Err(new Error(`Couldn't parse YAML input: ${e.name}: ${e.message}`));
  }
}

/**
 * Executes task queries using DataView API based on YAML configuration.
 * Takes a TaskQuerySpec (parsed from YAML) and converts it into a DataView query
 * that yields formatted events with links for calendar display.
 * This runner specifically handles DataView TaskList queries.
 * For whole files or plain lists, use FileQueryRunner or ListQueryRunner instead.
 */
export class TaskQueryRunner {
  /** The YAML-based query specification defining filters and display rules */
  yaml_spec: TaskQuerySpec;

  /**
   * Creates a new TaskQueryRunner.
   *
   * @param yaml_spec - The task query specification (typically from taskQueryFromYaml)
   */
  constructor(yaml_spec:TaskQuerySpec) {
    this.yaml_spec = yaml_spec;
  }

  /**
   * Executes the task query using the DataView API.
   * Filters tasks according to the spec's matchers and formats them for display.
   * Used by the calendar renderer to fetch and format task events.
   *
   * @param dv - The DataView API instance
   * @returns Array of Event objects representing matching tasks
   */
  query(dv:any):Event[] {
    let tasks:any = dv.pages(this.yaml_spec.pages || "");
    for(let task_spec of this.yaml_spec.tasks) {
      tasks.where((task:any) => checkTaskMatcher(task,task_spec));
    }
    tasks.map((task:any)=>{
      let display = taskDisplayText(task,this.yaml_spec.display);
      let link = task.file.path;
      return dv.fileLink(link,false,display);
    });
    return tasks;
  }
}
