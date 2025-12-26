/**
 * Problem 4: Three ways to sum to n
 * 
 * Input: n - any integer
 * Output: summation to n, i.e. sum_to_n(5) === 1 + 2 + 3 + 4 + 5 === 15
 * 
 * Assumption: Input will always produce a result lesser than Number.MAX_SAFE_INTEGER
 */

/**
 * Implementation A: Iterative Loop
 * 
 * Complexity: O(n) time, O(1) space
 * Efficiency: Linear time complexity. Simple and straightforward approach.
 * For large values of n, this will take n iterations.
 * Space efficient as it only uses a constant amount of extra memory.
 */
function sum_to_n_a(n: number): number {
  if (n <= 0) return 0;
  
  let sum = 0;
  for (let i = 1; i <= n; i++) {
    sum += i;
  }
  return sum;
}

/**
 * Implementation B: Recursive Approach
 * 
 * Complexity: O(n) time, O(n) space
 * Efficiency: Linear time complexity but uses O(n) space for the call stack.
 * Each recursive call adds a frame to the stack until we reach the base case.
 * For very large values of n, this could cause a stack overflow.
 * More elegant mathematically but less efficient in terms of memory.
 */
function sum_to_n_b(n: number): number {
  if (n <= 0) return 0;
  if (n === 1) return 1;
  
  return n + sum_to_n_b(n - 1);
}

/**
 * Implementation C: Mathematical Formula (Gauss Formula)
 * 
 * Complexity: O(1) time, O(1) space
 * Efficiency: Constant time and space complexity. This is the most efficient approach.
 * Uses the mathematical formula discovered by Gauss: n * (n + 1) / 2
 * Works for any value of n without iteration or recursion.
 * Best choice for production code when performance matters.
 */
function sum_to_n_c(n: number): number {
  if (n <= 0) return 0;
  
  return (n * (n + 1)) / 2;
}

// Test cases
// console.log("sum_to_n_a(5) =", sum_to_n_a(5)); // Expected: 15
// console.log("sum_to_n_b(5) =", sum_to_n_b(5)); // Expected: 15
// console.log("sum_to_n_c(5) =", sum_to_n_c(5)); // Expected: 15

// console.log("sum_to_n_a(10) =", sum_to_n_a(10)); // Expected: 55
// console.log("sum_to_n_b(10) =", sum_to_n_b(10)); // Expected: 55
// console.log("sum_to_n_c(10) =", sum_to_n_c(10)); // Expected: 55

