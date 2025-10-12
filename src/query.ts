import { parseYaml } from "obsidian";
import { Event } from "./calendar";
import {Option} from './option';
import {Result} from "./result";


abstract class Filter {
  abstract match(data:any):boolean;
}

/// Check the string provided to see if it's a match with the regex.
export class RegexFilter {
  reg: RegExp;
  invert: boolean;
  constructor(pattern:RegExp,inverting:boolean=false) {
    this.invert = inverting;
    this.reg = pattern;
  } 
  // This function requires the item you give it to have a `text` property! It's meant to be used with DataView lists.
  match(data:any):boolean {
    let matched = this.reg.exec(data.text) && true;
    return (!this.invert && matched) || (this.invert && !matched);
  }
}


// follow a dotted path of field accessors to the end, then compare to a value. 
// If the value is a RegExp it will be matched, otherwise the `==` operator is used
// to compare.
export class KVFilter {
  dotpath: string[]
  value: Option<any>
  invert: boolean
  
  constructor(dotpath:string[], value: Option<any>,invert:boolean = false) {
    this.dotpath = dotpath;
    this.value = value;
    this.invert = invert;
  }
  
  match(data:any):boolean {
    let item_opt = KVFilter.extract(this.dotpath, data);
    return this.value.andThen((v:any)=> {
      return item_opt.map((item)=>{
        if(v instanceof RegExp) {
          return v.exec(item)&&true
        } else {
          return v == item;
        }
      })
    }).unwrapOr(false);
  }
  static extract(dotpath:string[], value:any):Option<any> {
    let item = value;
    for(let i=0; i<dotpath.length; i++) {
      if(!item.hasOwnProperty(dotpath[i])) {
        return Option.None();
      } else {
        item = item[dotpath[i]]
      }
    }
    return Option.Some(item);
  }
}

export abstract class Query {
  filters: Filter[];
  public scanRoot: Option<string>;
  display: (data:any)=>string;
  
  constructor() {
    this.filters = [];
    this.scanRoot = Option.None();
  }
  
  abstract scan(dvapi:DataView):Event[];

  // this function parses any number of Query subclasses from the YAML provided
  // and then creates a union Query that combines all of them into a single event
  // list.
  // 
  // FileQuery:
  //    root: "projects/school/to-grade"
  //    date:
  //      extract_key: "frontmatter.due_date"
  //      pattern: 
  //        - replace: "(\d\d\d\d)[-/\.](\d?\d)[-/\.](\d?\d)"
  //          with: "$1-$2-$3"
  //        - replace: "(\d\d)/(\d\d)/(\d\d(\d\d)?)"
  //          with: "$3-$1-$2"
  //    filter:
  //      key: "frontmatter.grade"
  //      invert: true
  //    display:
  //      extract_key: "frontmatter.title"
  //
  // rewrite=[/(#hw )/g, ""]
  // [TaskQuery]
  // root="projects/school/to-grade"
  // filters=[{"completed"=false}]
  
  fromYaml(yml_src:string) : Result<Query,Error> {
    let yml=parseYaml(yml_src);
       
    return Result.Ok(new ListQuery());
  }
  
  withRoot(s:string):Query {
    this.scanRoot = Option.Some(s);
    return this;
  }
  withKVFilter(dotpath:string[]|string, value:Option<any>, inverted=false):Query {
    if(typeof(dotpath)==="string") {
      this.filters.push(new KVFilter(dotpath.split('.'), value, inverted));
    } else {
      this.filters.push(new KVFilter(dotpath,value,inverted));
    }
    return this;
  }
}

export class FileQuery extends Query {
  scan(dv: any): Event[] {
    let result: any = undefined;
    if (this.scanRoot.is_some) {
      result = dv.pages(this.scanRoot.unwrap()).file;
    } else {
      result = dv.pages().file;
    }
    for (let filter of this.filters) {
      if (result && result.length > 0) {
        result = result.where((item: any) => filter.match(item))
      }
    }
    return []
  }
  withFrontmatterMatching(dotpath: string | string[], pattern: RegExp): FileQuery {
    if (typeof (dotpath) === "string") {
      dotpath = dotpath.split(".");
    }
    this.filters.push(new KVFilter(["frontmatter", ...dotpath], Option.Some(pattern), false));
    return this;
  }
  withFrontmatterNotMatching(dotpath: string | string[], pattern: RegExp): FileQuery {
    if (typeof (dotpath) === "string") {
      dotpath = dotpath.split(".");
    }
    this.filters.push(new KVFilter(["frontmatter", ...dotpath], Option.Some(pattern), true));
    return this;
  }
  /// The extractor is going to look for a named group with the name (?<display>), or it will 
  // pick groups[0] if that isn't defined. If the extractor is omitted, it'll just dump the entire
  // string contents of whatever's at the dotpath. AND, if the dotpath is empty, it'll dump the whole file!
  withDisplayExtractor(dotpath: string | string[], extractor: Option<RegExp>): FileQuery {
    let path:string[] = [];
    if(typeof(dotpath) === "string") {
      path = dotpath.split('.');
    } else {
      path = dotpath;
    }
    this.display = (data):string=>{
      let match = extractor.map((rgx)=>rgx.exec(KVFilter.extract(path,data).unwrapOr(""))).unwrapOr(undefined);
      if(match?.groups['display']){
        return match.groups['display'];
      } else {
        return data.slice(0,100);
      }
    }
    return this;
  }
}


export class ListQuery extends Query {
  scan(dv:any):Event[] {
    let result:any = undefined;
    if(this.scanRoot.is_some) {
      result = dv.pages(this.scanRoot.unwrap()).file.lists;
    } else {
      result = dv.pages().file.lists;
    }
    for(let filter of this.filters) {
      if(result && result.length>0) {
        result = result.where((item:any)=>filter.match(item))
      }
    }
    return []
  }
  withTextMatching(pattern:RegExp):Query {
    this.filters.push(new KVFilter(["text"],Option.Some(pattern),false));
    return this;
  }
  withTextNotMatching(pattern:RegExp):Query {
    this.filters.push(new KVFilter(["text"],Option.Some(pattern),true));
    return this;
  }
}

export class TaskQuery extends Query {
  completed: Option<boolean>
  scan(dvapi:any):Event[] {
    return []
  }
  withTextMatching(pattern:RegExp):Query {
    this.filters.push(new KVFilter(["text"],Option.Some(pattern),false));
    return this;
  }
  withTextNotMatching(pattern:RegExp):Query {
    this.filters.push(new KVFilter(["text"],Option.Some(pattern),true));
    return this;
  }
}


