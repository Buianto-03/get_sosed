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

// function summarize(orders) {
//   return orders
//     .filter((order) => order.status === 'paid')
//     .reduce((acc, order) => {
//       acc[order.userId] = (acc[order.userId] ?? 0) + order.amount;

//       return acc;
//     }, {});
// }

// const orders = [
//   { userId: 'u1', amount: 100, status: 'paid' },
//   { userId: 'u2', amount: 200, status: 'paid' },
//   { userId: 'u1', amount: 50, status: 'paid' },
//   { userId: 'u2', amount: 300, status: 'cancelled' },
// ];

// console.log(summarize(orders));
// console.log('A');

// setTimeout(() => {
//   console.log('B');
// }, 0);

// Promise.resolve().then(() => {
//   console.log('C');
// });

// async function run() {
//   console.log('D');
//   await Promise.resolve();
//   console.log('E');
// }

// run();

// console.log('F');
// function findCommon(first, second) {
//   return first.filter(value => second.includes(value));
// }

// const first = [1, 2, 2, 3, 4, 5];
// const second = [2, 4, 6];

// console.log(findCommon(first, second));

// const merge = (arr: number[][]): number[][] => {
//   const copy = [...arr].sort((a, b) => a[0] - b[0]);
//   const res: number[][] = [];

//   for (const [start, end] of copy) {
//     const last = res[res.length - 1];

//     if (!last || start > last[1]) {
//       res.push([start, end]);
//     } else {
//       last[1] = Math.max(end, last[1]);
//     }
//   }

//   return res;
// };
// console.log(
//   merge([
//     [1, 3],
//     [2, 6],
//     [8, 10],
//     [12, 16],
//     [15, 18],
//   ]),
// );

// const intersections = (arr1: number[], arr2: number[]): number[] => {
//   const res: number[] = [];

//   arr1.forEach((el) => {
//     if (arr2.includes(el)) {
//       res.push(el);
//     }
//   });

//   return res;
// };

const intersections = (arr1: number[], arr2: number[]): number[] => {
  const set = new Set(arr1);
  return arr2.filter((el) => set.has(el));
};

console.log(intersections([1, 2, 3, 4, 5, 6], [4, 5, 6, 7, 8, 9, 0]));
