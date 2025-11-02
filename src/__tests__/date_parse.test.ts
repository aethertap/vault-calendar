import { DateTime } from 'luxon';
import {SimpleDate,DateRange,DatePattern, parseDatePattern} from '../datepattern';

test("SimpleDate parses a date", ()=>{
  expect(SimpleDate.parse('2025-09-10').date).toEqual(DateTime.local(2025,9,10));
  expect(SimpleDate.parse("2027-1-55")).toBeUndefined();
  expect(SimpleDate.parse("This event is on october tenth 2025-09-10")).toEqual(new SimpleDate(DateTime.local(2025,9,10)));
})


test("DateRange parses a date range", () => {
  expect(DateRange.parse("2025-09-10-2025-09-11")).toEqual(new DateRange(DateTime.local(2025,9,10), 2));
  expect(DateRange.parse("2025-09-10 through 2025-09-11")).toEqual(new DateRange(DateTime.local(2025,9,10), 2));
  expect(DateRange.parse("An event that goes from 2025-09-12 through 2025-09-11, which is cool. and stuff. ")).toBeUndefined();
  expect(DateRange.parse("2025-09-10  - 2025-09-11")).toEqual(new DateRange(DateTime.local(2025,9,10), 2));
})

test("DateRange contains the right dates", () => {
  let dr = parseDatePattern("2025-09-10-2025-09-21");
  expect(dr.contains(DateTime.local(2025,9,9))).toBeFalsy();
  expect(dr.contains(DateTime.local(2025,9,10))).toBeTruthy();
  expect(dr.contains(DateTime.local(2025,9,17))).toBeTruthy();
  expect(dr.contains(DateTime.local(2025,9,21))).toBeTruthy();
  expect(dr.contains(DateTime.local(2025,9,22))).toBeFalsy();
  
  dr = parseDatePattern("2025-08-10-2025-09-21");
  expect(dr.contains(DateTime.local(2025,8,9))).toBeFalsy();
  expect(dr.contains(DateTime.local(2025,8,10))).toBeTruthy();
  expect(dr.contains(DateTime.local(2025,8,17))).toBeTruthy();
  expect(dr.contains(DateTime.local(2025,9,21))).toBeTruthy();
  expect(dr.contains(DateTime.local(2025,9,22))).toBeFalsy();
 
  dr = parseDatePattern("2025-08-10");
  expect(dr.contains(DateTime.local(2025,8,9))).toBeFalsy();
  expect(dr.contains(DateTime.local(2025,8,10))).toBeTruthy();
  expect(dr.contains(DateTime.local(2025,8,11))).toBeFalsy();
 })

test("DateRange overlaps correctly", () => {
  let dr1=parseDatePattern("2025-08-28 - 2025-09-03") as DateRange;
  let dr2=parseDatePattern("2025-09-03") as DateRange;
  expect(dr1.overlaps(dr2)).toBeTruthy();
  //expect(dr2.overlaps(dr1)).toBeTruthy();
})
