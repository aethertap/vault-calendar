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

export interface KeyMatcher {
  keys: string[],
  matchers: (RegExp|boolean|number)[],
}

export interface KeyReplacer {
  keys: string[],
  replacers: {replace:RegExp, replacement:string}[] 
}

export interface TaskQuerySpec {
  pages?: string,
  tasks: KeyMatcher[],
  display: KeyReplacer[],
}

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

/// TaskQueryRunner takes a configuration that matches TaskQuerySpec 
// (which can be parsed directly from yaml), and turns it into a DataView
// query that yields a list of formatted events with links. This query runner
// only works on dataview TaskList type queries; to get whole files or plain
// lists, use FileQueryRunner or ListQueryRunner.

export class TaskQueryRunner {
  yaml_spec: TaskQuerySpec;
  constructor(yaml_spec:TaskQuerySpec) {
    this.yaml_spec = yaml_spec;
  }

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
