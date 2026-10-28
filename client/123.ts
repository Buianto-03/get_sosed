/* eslint-disable no-plusplus */
// const studs = [
//   { name: 'Alex', age: 22, groupId: 1 },
//   { name: 'Mike', age: 10, groupId: 1 },
//   { name: 'Jane', age: 18, groupId: 1 },
//   { name: 'Leo', age: 12, groupId: 2 },
//   { name: 'Rick', age: 3, groupId: 2 },
//   { name: 'Ben', age: 21, groupId: 1 },
//   { name: 'Max', age: 30, groupId: 2 },
// ];
// type Stud = (typeof studs)[number];

// const sortById = (arr: Stud[], field: keyof Stud): Record<string, string[]> =>
//   arr.reduce<Record<string, string[]>>((acc, cur) => {
//     const key = cur[field];
//     if (acc[key]) {
//       acc[key].push(cur.name);
//     } else {
//       acc[key] = [cur.name];
//     }
//     return acc;
//   }, {});

// // надо получить
// console.log(sortById(studs, 'groupId'));

// type NestedNumbers = (number | NestedNumbers)[];

// const flat = (arr: NestedNumbers): number[] => {
//   const res: number[] = [];

//   // eslint-disable-next-line no-plusplus
//   for (let i = 0; i < arr.length; i++) {
//     const item = arr[i];
//     if (Array.isArray(item)) {
//       res.push(...flat(item));
//     } else {
//       res.push(item);
//     }
//   }

//   return res;
// };

// const flatStack = (arr: NestedNumbers): number[] => {
//   const res: number[] = [];

//   let copy = [...arr].reverse();
//   while (copy.length > 0) {
//     const item = copy.pop();
//     if (Array.isArray(item)) {
//       copy = [...copy, ...item.reverse()];
//     } else {
//       res.push(item);
//     }
//   }

//   return res;
// };

// console.log(flat([1, [1, 2, [3, 4]], [2, 4]]));
// console.log(flatStack([1, [1, 2, [3, 4]], [2, 4]]));

// const arr = [
//   { name: 'width', value: 10 },
//   { name: 'height', value: 20 },
// ];
// // Надо сделать объект:
// // {width: 10, height: 20}

// const f = (a: typeof arr): Record<string, number> =>
//   a.reduce<Record<string, number>>((acc, cur) => {
//     acc[cur.name] = cur.value;
//     return acc;
//   }, {});
// console.log(f(arr));

// const palindrom = (str: string): boolean => {
//   let left = 0;
//   let right = str.length - 1;
//   while (left < right) {
//     if (str[left] !== str[right]) {
//       return false;
//     }
//     left++;
//     right--;
//   }
//   return true;
// };
// console.log(palindrom('шалаш'));

// const twoSum = (arr: number[], target: number): [number, number] | null => {
//   const map = new Set();
//   for (let i = 0; i < arr.length; i++) {
//     const dif = target - arr[i];
//     if (map.has(dif)) {
//       return [dif, arr[i]];
//     }
//     map.add(arr[i]);
//   }
//   return null;
// };
// const twoSum = (arr: number[], target: number): [number, number] | null => {
//   const map = new Map();
//   for (let i = 0; i < arr.length; i++) {
//     const dif = target - arr[i];
//     if (map.has(dif)) {
//       return [map.get(dif), i];
//     }
//     map.set(arr[i], i);
//   }
//   return null;
// };

// function sortArr(arr) {
//   const set = Array.from(new Set(arr));
//   // console.log(set);

//   const result = [];
//   let start = set[0];
//   let end = 0;
//   for (let i = 0; i < set.length; i++) {
//     const current = set[i];
//     const next = set[i + 1];
//     if (current + 1 !== next) {
//       end = current;
//       if (end !== start) {
//         result.push(`${start} - ${end}`);
//         start = next;
//         // console.log(start);
//       } else {
//         result.push(`${start}`);
//         start = next;
//       }
//     }
//   }
//   return result;
// }
// const sortArr = (arr: number[]): string[] => {
//   const res: string[] = [];

//   let start: number = arr[0];

//   for (let i = 0; i < arr.length; i++) {
//     const current = arr[i];
//     const next = arr[i + 1];
//     if (current + 1 !== next) {
//       if (current !== start) {
//         res.push(`${start} - ${current}`);
//       } else {
//         res.push(`${start}`);
//       }
//       start = next;
//     }
//   }

//   return res;
// };

// const array = [1, 2, 33, 4, 5, 6, 7, 8, 9, 10, 10, 12, 13];

// console.log(sortArr(array));

// type Func<Args extends unknown[]> = (...args: Args) => void;

// const deb = <Args extends unknown[]>(fn: Func<Args>, delay: number): Func<Args> => {
//   let timer: ReturnType<typeof setTimeout> | null = null;

//   return (...args) => {
//     if (timer) {
//       clearTimeout(timer);
//     }
//     timer = setTimeout(() => {
//       timer = null;
//       fn(...args);
//     }, delay);
//   };
// };

// function throttle<Args extends unknown[]>(
//   fn: (...args: Args) => void,
//   delay: number,
// ): (...args: Args) => void {
//   let timer: ReturnType<typeof setTimeout> | null = null;

//   return (...args) => {
//     if (timer !== null) return;

//     fn(...args);

//     timer = setTimeout(() => {
//       timer = null;
//     }, delay);
//   };
// }

// const trot = (fn: (...args: unknown[]) => void, delay: number): ((...args: unknown[]) => void) => {
//   let timer: ReturnType<typeof setTimeout> | null = null;

//   return (...args) => {
//     if (timer !== null) return;

//     fn(...args);

//     timer = setTimeout(() => {
//       timer = null;
//     }, delay);
//   };
// };
