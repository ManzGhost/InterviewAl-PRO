export type SupportedLanguage = 'Python' | 'Java' | 'C++' | 'JavaScript' | 'TypeScript' | 'Go';

export interface LanguageMeta {
  id: SupportedLanguage;
  label: string;
  version: string;
  extension: string;
  iconColor: string;
}

export const SUPPORTED_LANGUAGES: LanguageMeta[] = [
  { id: 'Python', label: 'Python', version: 'Python 3.12', extension: 'py', iconColor: 'text-amber-500 dark:text-amber-400' },
  { id: 'Java', label: 'Java', version: 'Java 21 LTS', extension: 'java', iconColor: 'text-red-500 dark:text-red-400' },
  { id: 'C++', label: 'C++', version: 'C++ 20', extension: 'cpp', iconColor: 'text-blue-500 dark:text-blue-400' },
  { id: 'JavaScript', label: 'JavaScript', version: 'ES6+', extension: 'js', iconColor: 'text-yellow-500 dark:text-yellow-400' },
  { id: 'TypeScript', label: 'TypeScript', version: 'TS 5.4', extension: 'ts', iconColor: 'text-sky-500 dark:text-sky-400' },
  { id: 'Go', label: 'Go', version: 'Go 1.22', extension: 'go', iconColor: 'text-cyan-500 dark:text-cyan-400' },
];

export interface Problem {
  id: string;
  title: string;
  category: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  description: string;
  constraints: string[];
  examples: Array<{ input: string; output: string; explanation?: string }>;
  starterCodeJava: string;
  starterCodeJs: string;
  starterCodePython?: string;
  starterCodeCpp?: string;
  starterCodeTs?: string;
  starterCodeGo?: string;
  solutionJava: string;
  solutionJs: string;
  solutionPython?: string;
  solutionCpp?: string;
  solutionTs?: string;
  solutionGo?: string;
  solutionApproach: string;
  timeComplexity: string;
  spaceComplexity: string;
  hints: string[];
  isCustom?: boolean;
}

export function getStarterCode(problem: Problem, lang: SupportedLanguage): string {
  switch (lang) {
    case 'Python':
      return problem.starterCodePython || `# Solution for ${problem.title}\nclass Solution:\n    def solve(self):\n        # TODO: Implement your solution here\n        pass\n`;
    case 'Java':
      return problem.starterCodeJava || `class Solution {\n    // TODO: Implement your solution here\n}`;
    case 'C++':
      return problem.starterCodeCpp || `#include <vector>\n#include <iostream>\nusing namespace std;\n\nclass Solution {\npublic:\n    void solve() {\n        // TODO: Implement solution\n    }\n};`;
    case 'JavaScript':
      return problem.starterCodeJs || `function solve() {\n  // TODO: Implement your solution here\n}`;
    case 'TypeScript':
      return problem.starterCodeTs || problem.starterCodeJs || `function solve(): any {\n  // TODO: Implement your solution here\n}`;
    case 'Go':
      return problem.starterCodeGo || `package main\n\n// Solution for ${problem.title}\nfunc solve() {\n    // TODO: Implement solution\n}`;
    default:
      return problem.starterCodeJs;
  }
}

export function getSolutionCode(problem: Problem, lang: SupportedLanguage): string {
  switch (lang) {
    case 'Python':
      return problem.solutionPython || problem.starterCodePython || '';
    case 'Java':
      return problem.solutionJava || problem.starterCodeJava;
    case 'C++':
      return problem.solutionCpp || problem.starterCodeCpp || '';
    case 'JavaScript':
      return problem.solutionJs || problem.starterCodeJs;
    case 'TypeScript':
      return problem.solutionTs || problem.solutionJs || problem.starterCodeJs;
    case 'Go':
      return problem.solutionGo || problem.starterCodeGo || '';
    default:
      return problem.solutionJs;
  }
}

export const initialProblems: Problem[] = [
  {
    id: 'two-sum',
    title: 'Two Sum',
    category: 'Arrays & Hash Table',
    difficulty: 'Easy',
    description:
      'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target. You may assume that each input would have exactly one solution, and you may not use the same element twice.',
    constraints: [
      '2 <= nums.length <= 10^4',
      '-10^9 <= nums[i] <= 10^9',
      '-10^9 <= target <= 10^9',
      'Only one valid answer exists.',
    ],
    examples: [
      {
        input: 'nums = [2,7,11,15], target = 9',
        output: '[0,1]',
        explanation: 'Because nums[0] + nums[1] == 9, we return [0, 1].',
      },
      {
        input: 'nums = [3,2,4], target = 6',
        output: '[1,2]',
        explanation: 'nums[1] + nums[2] == 6, so indices [1, 2] are returned.',
      },
    ],
    starterCodePython: `class Solution:
    def twoSum(self, nums: list[int], target: int) -> list[int]:
        # TODO: Return indices of the two numbers that sum to target
        return []`,
    solutionPython: `class Solution:
    def twoSum(self, nums: list[int], target: int) -> list[int]:
        seen = {}
        for i, num in enumerate(nums):
            complement = target - num
            if complement in seen:
                return [seen[complement], i]
            seen[num] = i
        return []`,
    starterCodeJava: `import java.util.HashMap;
import java.util.Map;

class Solution {
    public int[] twoSum(int[] nums, int target) {
        // TODO: Implement your solution here
        return new int[] {};
    }
}`,
    solutionJava: `import java.util.HashMap;
import java.util.Map;

class Solution {
    public int[] twoSum(int[] nums, int target) {
        Map<Integer, Integer> map = new HashMap<>();
        for (int i = 0; i < nums.length; i++) {
            int complement = target - nums[i];
            if (map.containsKey(complement)) {
                return new int[] { map.get(complement), i };
            }
            map.put(nums[i], i);
        }
        return new int[] {};
    }
}`,
    starterCodeCpp: `#include <vector>
#include <unordered_map>
using namespace std;

class Solution {
public:
    vector<int> twoSum(vector<int>& nums, int target) {
        // TODO: Implement your solution here
        return {};
    }
};`,
    solutionCpp: `#include <vector>
#include <unordered_map>
using namespace std;

class Solution {
public:
    vector<int> twoSum(vector<int>& nums, int target) {
        unordered_map<int, int> numMap;
        for (int i = 0; i < nums.size(); i++) {
            int complement = target - nums[i];
            if (numMap.count(complement)) {
                return {numMap[complement], i};
            }
            numMap[nums[i]] = i;
        }
        return {};
    }
};`,
    starterCodeJs: `function twoSum(nums, target) {
  // TODO: Implement your solution here
  return [];
}`,
    solutionJs: `function twoSum(nums, target) {
  const map = new Map();
  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    if (map.has(complement)) {
      return [map.get(complement), i];
    }
    map.set(nums[i], i);
  }
  return [];
}`,
    starterCodeTs: `function twoSum(nums: number[], target: number): number[] {
  // TODO: Implement your solution here
  return [];
}`,
    solutionTs: `function twoSum(nums: number[], target: number): number[] {
  const map = new Map<number, number>();
  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    if (map.has(complement)) {
      return [map.get(complement)!, i];
    }
    map.set(nums[i], i);
  }
  return [];
}`,
    starterCodeGo: `package main

func twoSum(nums []int, target int) []int {
    // TODO: Implement your solution here
    return []int{}
}`,
    solutionGo: `package main

func twoSum(nums []int, target int) []int {
    seen := make(map[int]int)
    for i, num := range nums {
        complement := target - num
        if idx, ok := seen[complement]; ok {
            return []int{idx, i}
        }
        seen[num] = i
    }
    return []int{}
}`,
    solutionApproach:
      'Instead of the quadratic O(n²) approach that checks every pair with nested loops, we use a Hash Map (lookup table). In a single iteration, for each number x at index i, we calculate its required complement = target - x. If complement is already in our map, we have found our match in O(1) average lookup time. Otherwise, we insert x and its index i into the map and continue.',
    timeComplexity: 'O(n)',
    spaceComplexity: 'O(n)',
    hints: [
      'A brute force search checks every pair (i, j) with O(n²) time. Can you do it in a single pass using extra memory?',
      'For each number nums[i], what exact number are you looking for to complete the sum? (target - nums[i]).',
      'Use a Hash Map to store previously visited numbers and their indices for O(1) average lookups.',
    ],
  },
  {
    id: 'reverse-linked-list',
    title: 'Reverse Linked List',
    category: 'Linked Lists',
    difficulty: 'Easy',
    description:
      'Given the head of a singly linked list, reverse the list, and return the reversed list.',
    constraints: [
      'The number of nodes in the list is the range [0, 5000].',
      '-5000 <= Node.val <= 5000',
    ],
    examples: [
      {
        input: 'head = [1,2,3,4,5]',
        output: '[5,4,3,2,1]',
        explanation: 'The pointers between nodes are inverted.',
      },
      {
        input: 'head = [1,2]',
        output: '[2,1]',
      },
      {
        input: 'head = []',
        output: '[]',
      },
    ],
    starterCodePython: `# Definition for singly-linked list.
# class ListNode:
#     def __init__(self, val=0, next=None):
#         self.val = val
#         self.next = next

class Solution:
    def reverseList(self, head: Optional[ListNode]) -> Optional[ListNode]:
        # TODO: Reverse singly linked list in-place
        return None`,
    solutionPython: `class Solution:
    def reverseList(self, head: Optional[ListNode]) -> Optional[ListNode]:
        prev = None
        curr = head
        while curr:
            next_temp = curr.next
            curr.next = prev
            prev = curr
            curr = next_temp
        return prev`,
    starterCodeJava: `/**
 * Definition for singly-linked list.
 * public class ListNode {
 *     int val;
 *     ListNode next;
 *     ListNode(int val) { this.val = val; }
 * }
 */
class Solution {
    public ListNode reverseList(ListNode head) {
        // TODO: Reverse the singly linked list
        return null;
    }
}`,
    solutionJava: `class Solution {
    public ListNode reverseList(ListNode head) {
        ListNode prev = null;
        ListNode curr = head;
        while (curr != null) {
            ListNode nextTemp = curr.next; // Stash next node
            curr.next = prev;              // Invert link backwards
            prev = curr;                   // Advance prev
            curr = nextTemp;               // Advance curr
        }
        return prev;
    }
}`,
    starterCodeCpp: `/**
 * Definition for singly-linked list.
 * struct ListNode {
 *     int val;
 *     ListNode *next;
 *     ListNode(int x) : val(x), next(nullptr) {}
 * };
 */
class Solution {
public:
    ListNode* reverseList(ListNode* head) {
        // TODO: Reverse the singly linked list
        return nullptr;
    }
};`,
    solutionCpp: `class Solution {
public:
    ListNode* reverseList(ListNode* head) {
        ListNode* prev = nullptr;
        ListNode* curr = head;
        while (curr != nullptr) {
            ListNode* nextTemp = curr->next;
            curr->next = prev;
            prev = curr;
            curr = nextTemp;
        }
        return prev;
    }
};`,
    starterCodeJs: `/**
 * Definition for singly-linked list.
 * function ListNode(val, next) {
 *     this.val = (val===undefined ? 0 : val)
 *     this.next = (next===undefined ? null : next)
 * }
 */
function reverseList(head) {
  // TODO: Reverse the singly linked list
  return null;
}`,
    solutionJs: `function reverseList(head) {
  let prev = null;
  let curr = head;
  while (curr !== null) {
    const nextTemp = curr.next; // Stash next node
    curr.next = prev;           // Invert link backwards
    prev = curr;                // Advance prev
    curr = nextTemp;            // Advance curr
  }
  return prev;
}`,
    starterCodeTs: `class ListNode {
  val: number;
  next: ListNode | null;
  constructor(val?: number, next?: ListNode | null) {
    this.val = val === undefined ? 0 : val;
    this.next = next === undefined ? null : next;
  }
}

function reverseList(head: ListNode | null): ListNode | null {
  // TODO: Reverse the singly linked list
  return null;
}`,
    solutionTs: `function reverseList(head: ListNode | null): ListNode | null {
  let prev: ListNode | null = null;
  let curr: ListNode | null = head;
  while (curr !== null) {
    const nextTemp = curr.next;
    curr.next = prev;
    prev = curr;
    curr = nextTemp;
  }
  return prev;
}`,
    starterCodeGo: `package main

type ListNode struct {
    Val  int
    Next *ListNode
}

func reverseList(head *ListNode) *ListNode {
    // TODO: Reverse the singly linked list
    return nil
}`,
    solutionGo: `package main

func reverseList(head *ListNode) *ListNode {
    var prev *ListNode
    curr := head
    for curr != nil {
        nextTemp := curr.Next
        curr.Next = prev
        prev = curr
        curr = nextTemp
    }
    return prev
}`,
    solutionApproach:
      'We maintain two pointers: `prev` initialized to null, and `curr` initialized to head. At each node, we save `curr.next` in `nextTemp`, redirect `curr.next` to point backwards to `prev`, then slide `prev` forward to `curr` and `curr` forward to `nextTemp`. When `curr` becomes null, `prev` points to the new head of the reversed list.',
    timeComplexity: 'O(n)',
    spaceComplexity: 'O(1)',
    hints: [
      'Think about reversing the direction of pointers node by node as you traverse.',
      'Remember to store the next node in a temporary variable before changing curr.next, or you will lose the rest of the list!',
      'When curr reaches null, what will prev be pointing to?',
    ],
  },
  {
    id: 'valid-parentheses',
    title: 'Valid Parentheses',
    category: 'Stacks',
    difficulty: 'Easy',
    description:
      'Given a string s containing just the characters "(", ")", "{", "}", "[" and "]", determine if the input string is valid. An input string is valid if open brackets are closed by the same type of brackets and in the correct order.',
    constraints: [
      '1 <= s.length <= 10^4',
      's consists of parentheses only: ()[]{}',
    ],
    examples: [
      { input: 's = "()[]{}"', output: 'true' },
      { input: 's = "(]"', output: 'false' },
      { input: 's = "([)]"', output: 'false' },
      { input: 's = "{[]}"', output: 'true' },
    ],
    starterCodePython: `class Solution:
    def isValid(self, s: str) -> bool:
        # TODO: Validate balanced parentheses
        return False`,
    solutionPython: `class Solution:
    def isValid(self, s: str) -> bool:
        stack = []
        mapping = {")": "(", "}": "{", "]": "["}
        for char in s:
            if char in mapping:
                top = stack.pop() if stack else '#'
                if mapping[char] != top:
                    return False
            else:
                stack.append(char)
        return not stack`,
    starterCodeJava: `import java.util.Stack;

class Solution {
    public boolean isValid(String s) {
        // TODO: Validate balanced parentheses
        return false;
    }
}`,
    solutionJava: `import java.util.Stack;

class Solution {
    public boolean isValid(String s) {
        Stack<Character> stack = new Stack<>();
        for (char c : s.toCharArray()) {
            if (c == '(') stack.push(')');
            else if (c == '{') stack.push('}');
            else if (c == '[') stack.push(']');
            else if (stack.isEmpty() || stack.pop() != c) return false;
        }
        return stack.isEmpty();
    }
}`,
    starterCodeCpp: `#include <string>
#include <stack>
using namespace std;

class Solution {
public:
    bool isValid(string s) {
        // TODO: Validate balanced parentheses
        return false;
    }
};`,
    solutionCpp: `#include <string>
#include <stack>
using namespace std;

class Solution {
public:
    bool isValid(string s) {
        stack<char> st;
        for (char c : s) {
            if (c == '(') st.push(')');
            else if (c == '{') st.push('}');
            else if (c == '[') st.push(']');
            else {
                if (st.empty() || st.top() != c) return false;
                st.pop();
            }
        }
        return st.empty();
    }
};`,
    starterCodeJs: `function isValid(s) {
  // TODO: Validate balanced parentheses
  return false;
}`,
    solutionJs: `function isValid(s) {
  const stack = [];
  const map = { ')': '(', '}': '{', ']': '[' };
  for (const char of s) {
    if (char === '(' || char === '{' || char === '[') {
      stack.push(char);
    } else {
      if (stack.pop() !== map[char]) return false;
    }
  }
  return stack.length === 0;
}`,
    starterCodeTs: `function isValid(s: string): boolean {
  // TODO: Validate balanced parentheses
  return false;
}`,
    solutionTs: `function isValid(s: string): boolean {
  const stack: string[] = [];
  const map: Record<string, string> = { ')': '(', '}': '{', ']': '[' };
  for (const char of s) {
    if (char === '(' || char === '{' || char === '[') {
      stack.push(char);
    } else {
      if (stack.pop() !== map[char]) return false;
    }
  }
  return stack.length === 0;
}`,
    starterCodeGo: `package main

func isValid(s string) bool {
    // TODO: Validate balanced parentheses
    return false
}`,
    solutionGo: `package main

func isValid(s string) bool {
    stack := []rune{}
    match := map[rune]rune{')': '(', '}': '{', ']': '['}
    for _, ch := range s {
        if open, exists := match[ch]; exists {
            if len(stack) == 0 || stack[len(stack)-1] != open {
                return false
            }
            stack = stack[:len(stack)-1]
        } else {
            stack = append(stack, ch)
        }
    }
    return len(stack) == 0
}`,
    solutionApproach:
      'A Stack is the classic data structure for nested balance verification. When reading open brackets, we push either the bracket or its expected closing counterpart. When reading a closing bracket, the top of the stack must match it. If the stack is empty or the popped bracket does not match, the sequence is invalid. Finally, the stack must be empty at the end.',
    timeComplexity: 'O(n)',
    spaceComplexity: 'O(n)',
    hints: [
      'The most recently opened bracket must be closed first — this is the Last-In First-Out (LIFO) stack property.',
      'What happens if you encounter a closing bracket when your stack is empty?',
      'Ensure the stack is completely empty after iterating through all characters.',
    ],
  },
  {
    id: 'longest-substring',
    title: 'Longest Substring Without Repeating Characters',
    category: 'Sliding Window',
    difficulty: 'Medium',
    description:
      'Given a string s, find the length of the longest substring without duplicate characters.',
    constraints: [
      '0 <= s.length <= 5 * 10^4',
      's consists of English letters, digits, symbols and spaces.',
    ],
    examples: [
      {
        input: 's = "abcabcbb"',
        output: '3',
        explanation: 'The answer is "abc", with the length of 3.',
      },
      {
        input: 's = "bbbbb"',
        output: '1',
        explanation: 'The answer is "b", with the length of 1.',
      },
      {
        input: 's = "pwwkew"',
        output: '3',
        explanation: 'The answer is "wke", with length 3. Note "pwke" is a subsequence, not substring.',
      },
    ],
    starterCodePython: `class Solution:
    def lengthOfLongestSubstring(self, s: str) -> int:
        # TODO: Return length of longest substring without repeating characters
        return 0`,
    solutionPython: `class Solution:
    def lengthOfLongestSubstring(self, s: str) -> int:
        char_set = set()
        left = 0
        max_len = 0
        for right in range(len(s)):
            while s[right] in char_set:
                char_set.remove(s[left])
                left += 1
            char_set.add(s[right])
            max_len = max(max_len, right - left + 1)
        return max_len`,
    starterCodeJava: `import java.util.HashSet;
import java.util.Set;

class Solution {
    public int lengthOfLongestSubstring(String s) {
        // TODO: Return length of longest substring without repeating characters
        return 0;
    }
}`,
    solutionJava: `import java.util.HashSet;
import java.util.Set;

class Solution {
    public int lengthOfLongestSubstring(String s) {
        Set<Character> set = new HashSet<>();
        int maxLen = 0;
        int left = 0;
        for (int right = 0; right < s.length(); right++) {
            while (set.contains(s.charAt(right))) {
                set.remove(s.charAt(left++));
            }
            set.add(s.charAt(right));
            maxLen = Math.max(maxLen, right - left + 1);
        }
        return maxLen;
    }
}`,
    starterCodeCpp: `#include <string>
#include <unordered_set>
#include <algorithm>
using namespace std;

class Solution {
public:
    int lengthOfLongestSubstring(string s) {
        // TODO: Return length of longest substring without repeating characters
        return 0;
    }
};`,
    solutionCpp: `#include <string>
#include <unordered_set>
#include <algorithm>
using namespace std;

class Solution {
public:
    int lengthOfLongestSubstring(string s) {
        unordered_set<char> charSet;
        int left = 0, maxLen = 0;
        for (int right = 0; right < s.length(); right++) {
            while (charSet.count(s[right])) {
                charSet.erase(s[left++]);
            }
            charSet.insert(s[right]);
            maxLen = max(maxLen, right - left + 1);
        }
        return maxLen;
    }
};`,
    starterCodeJs: `function lengthOfLongestSubstring(s) {
  // TODO: Return length of longest substring without repeating characters
  return 0;
}`,
    solutionJs: `function lengthOfLongestSubstring(s) {
  const set = new Set();
  let maxLen = 0;
  let left = 0;
  for (let right = 0; right < s.length; right++) {
    while (set.has(s[right])) {
      set.delete(s[left++]);
    }
    set.add(s[right]);
    maxLen = Math.max(maxLen, right - left + 1);
  }
  return maxLen;
}`,
    starterCodeTs: `function lengthOfLongestSubstring(s: string): number {
  // TODO: Return length of longest substring without repeating characters
  return 0;
}`,
    solutionTs: `function lengthOfLongestSubstring(s: string): number {
  const set = new Set<string>();
  let maxLen = 0;
  let left = 0;
  for (let right = 0; right < s.length; right++) {
    while (set.has(s[right])) {
      set.delete(s[left++]);
    }
    set.add(s[right]);
    maxLen = Math.max(maxLen, right - left + 1);
  }
  return maxLen;
}`,
    starterCodeGo: `package main

func lengthOfLongestSubstring(s string) int {
    // TODO: Return length of longest substring without repeating characters
    return 0
}`,
    solutionGo: `package main

func lengthOfLongestSubstring(s string) int {
    charMap := make(map[byte]int)
    left, maxLen := 0, 0
    for right := 0; right < len(s); right++ {
        if prevIdx, exists := charMap[s[right]]; exists && prevIdx >= left {
            left = prevIdx + 1
        }
        charMap[s[right]] = right
        if currLen := right - left + 1; currLen > maxLen {
            maxLen = currLen
        }
    }
    return maxLen
}`,
    solutionApproach:
      'We use the Sliding Window pattern with two pointers: `left` and `right`. A Hash Set tracks the characters currently in the window `[left, right]`. As `right` scans forward, if `s[right]` already exists in the set, we contract the window from `left` (removing `s[left]` and incrementing `left`) until the duplicate is evicted. The window size `(right - left + 1)` is maximized at each step.',
    timeComplexity: 'O(n)',
    spaceComplexity: 'O(min(n, m)) where m is charset size (e.g. 128 for ASCII)',
    hints: [
      'Can you maintain a window of unique characters as you iterate from left to right?',
      'When you see a repeated character, which pointer do you need to advance?',
      'A HashSet allows checking for existing characters in O(1) time.',
    ],
  },
  {
    id: 'lru-cache',
    title: 'LRU Cache Implementation',
    category: 'System Design',
    difficulty: 'Medium',
    description:
      'Design a data structure that follows the constraints of a Least Recently Used (LRU) cache. Implement the LRUCache class with get and put methods in O(1) average time complexity.',
    constraints: [
      '1 <= capacity <= 3000',
      '0 <= key <= 10^4',
      '0 <= value <= 10^5',
      'At most 2 * 10^5 calls to get and put.',
    ],
    examples: [
      {
        input: '["LRUCache", "put", "put", "get", "put", "get", "put", "get", "get", "get"]\n[[2], [1, 1], [2, 2], [1], [3, 3], [2], [4, 4], [1], [3], [4]]',
        output: '[null, null, null, 1, null, -1, null, -1, 3, 4]',
        explanation: 'Key 2 is evicted when key 3 is added, because key 1 was recently read.',
      },
    ],
    starterCodePython: `class LRUCache:
    def __init__(self, capacity: int):
        # TODO: Initialize LRU cache with capacity
        pass

    def get(self, key: int) -> int:
        # TODO: Return value or -1 if not found
        return -1

    def put(self, key: int, value: int) -> None:
        # TODO: Insert or update, evict least recently used when over capacity
        pass`,
    solutionPython: `from collections import OrderedDict

class LRUCache:
    def __init__(self, capacity: int):
        self.capacity = capacity
        self.cache = OrderedDict()

    def get(self, key: int) -> int:
        if key not in self.cache:
            return -1
        self.cache.move_to_end(key)
        return self.cache[key]

    def put(self, key: int, value: int) -> None:
        if key in self.cache:
            self.cache.move_to_end(key)
        self.cache[key] = value
        if len(self.cache) > self.capacity:
            self.cache.popitem(last=False)`,
    starterCodeJava: `class LRUCache {
    public LRUCache(int capacity) {
        // TODO: Initialize LRU cache with capacity
    }
    
    public int get(int key) {
        // TODO: Return value or -1 if not found
        return -1;
    }
    
    public void put(int key, int value) {
        // TODO: Insert or update key-value pair, evicting LRU item if capacity exceeded
    }
}`,
    solutionJava: `import java.util.LinkedHashMap;
import java.util.Map;

class LRUCache extends LinkedHashMap<Integer, Integer> {
    private final int capacity;

    public LRUCache(int capacity) {
        // accessOrder=true enables LRU order on access
        super(capacity, 0.75f, true);
        this.capacity = capacity;
    }

    public int get(int key) {
        return super.getOrDefault(key, -1);
    }

    public void put(int key, int value) {
        super.put(key, value);
    }

    @Override
    protected boolean removeEldestEntry(Map.Entry<Integer, Integer> eldest) {
        return size() > capacity;
    }
}`,
    starterCodeCpp: `#include <unordered_map>
#include <list>
using namespace std;

class LRUCache {
public:
    LRUCache(int capacity) {
        // TODO: Initialize cache
    }
    
    int get(int key) {
        // TODO: Return value or -1
        return -1;
    }
    
    void put(int key, int value) {
        // TODO: Insert or update
    }
};`,
    solutionCpp: `#include <unordered_map>
#include <list>
using namespace std;

class LRUCache {
    int cap;
    list<pair<int, int>> lruList; // {key, value}
    unordered_map<int, list<pair<int, int>>::iterator> cache;

public:
    LRUCache(int capacity) : cap(capacity) {}

    int get(int key) {
        if (!cache.count(key)) return -1;
        lruList.splice(lruList.begin(), lruList, cache[key]);
        return cache[key]->second;
    }

    void put(int key, int value) {
        if (cache.count(key)) {
            cache[key]->second = value;
            lruList.splice(lruList.begin(), lruList, cache[key]);
            return;
        }
        if (cache.size() == cap) {
            int dKey = lruList.back().first;
            lruList.pop_back();
            cache.erase(dKey);
        }
        lruList.push_front({key, value});
        cache[key] = lruList.begin();
    }
};`,
    starterCodeJs: `class LRUCache {
  constructor(capacity) {
    // TODO: Initialize LRU cache with capacity
  }

  get(key) {
    // TODO: Return value or -1
    return -1;
  }

  put(key, value) {
    // TODO: Insert/update, evict least recently used when over capacity
  }
}`,
    solutionJs: `class LRUCache {
  constructor(capacity) {
    this.capacity = capacity;
    this.cache = new Map(); // JavaScript Map remembers original insertion order
  }

  get(key) {
    if (!this.cache.has(key)) return -1;
    // Refresh position to mark as recently used
    const val = this.cache.get(key);
    this.cache.delete(key);
    this.cache.set(key, val);
    return val;
  }

  put(key, value) {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.capacity) {
      // Evict oldest item (first key in map iterator)
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }
    this.cache.set(key, value);
  }
}`,
    starterCodeTs: `class LRUCache {
  constructor(capacity: number) {
    // TODO: Initialize LRU cache with capacity
  }

  get(key: number): number {
    // TODO: Return value or -1
    return -1;
  }

  put(key: number, value: number): void {
    // TODO: Insert/update
  }
}`,
    solutionTs: `class LRUCache {
  private capacity: number;
  private cache: Map<number, number>;

  constructor(capacity: number) {
    this.capacity = capacity;
    this.cache = new Map();
  }

  get(key: number): number {
    if (!this.cache.has(key)) return -1;
    const val = this.cache.get(key)!;
    this.cache.delete(key);
    this.cache.set(key, val);
    return val;
  }

  put(key: number, value: number): void {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.capacity) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey !== undefined) this.cache.delete(oldestKey);
    }
    this.cache.set(key, value);
  }
}`,
    starterCodeGo: `package main

type LRUCache struct {
    // TODO: Define struct fields
}

func Constructor(capacity int) LRUCache {
    return LRUCache{}
}

func (this *LRUCache) Get(key int) int {
    return -1
}

func (this *LRUCache) Put(key int, value int) {
}`,
    solutionGo: `package main

import "container/list"

type LRUCache struct {
    cap   int
    cache map[int]*list.Element
    list  *list.List
}

type entry struct {
    key, val int
}

func Constructor(capacity int) LRUCache {
    return LRUCache{
        cap:   capacity,
        cache: make(map[int]*list.Element),
        list:  list.New(),
    }
}

func (this *LRUCache) Get(key int) int {
    if el, ok := this.cache[key]; ok {
        this.list.MoveToFront(el)
        return el.Value.(*entry).val
    }
    return -1
}

func (this *LRUCache) Put(key int, value int) {
    if el, ok := this.cache[key]; ok {
        el.Value.(*entry).val = value
        this.list.MoveToFront(el)
        return
    }
    if this.list.Len() >= this.cap {
        oldest := this.list.Back()
        if oldest != nil {
            this.list.Remove(oldest)
            delete(this.cache, oldest.Value.(*entry).key)
        }
    }
    el := this.list.PushFront(&entry{key, value})
    this.cache[key] = el
}`,
    solutionApproach:
      'To achieve both O(1) retrieval and O(1) eviction, we combine a Hash Table with a Doubly Linked List. The hash table maps keys to nodes, while the doubly linked list orders nodes from least-recently-used (head) to most-recently-used (tail). Java LinkedHashMap (with accessOrder=true), Python OrderedDict, or JavaScript Map natively support insertion-order reordering in O(1) time.',
    timeComplexity: 'O(1) for both get and put',
    spaceComplexity: 'O(capacity)',
    hints: [
      'How can you store items so that finding an item is O(1) and moving an item to the front is O(1)?',
      'A Hash Map gives O(1) lookups; a Doubly Linked List gives O(1) removal and re-insertion.',
      'In Python, collections.OrderedDict has move_to_end() and popitem(last=False). In JavaScript, Map preserves key order.',
    ],
  },
  {
    id: 'binary-tree-level-order',
    title: 'Binary Tree Level Order Traversal',
    category: 'Trees & BFS',
    difficulty: 'Medium',
    description:
      'Given the root of a binary tree, return the level order traversal of its nodes values (i.e., from left to right, level by level).',
    constraints: [
      'The number of nodes in the tree is in the range [0, 2000].',
      '-1000 <= Node.val <= 1000',
    ],
    examples: [
      {
        input: 'root = [3,9,20,null,null,15,7]',
        output: '[[3],[9,20],[15,7]]',
      },
      {
        input: 'root = [1]',
        output: '[[1]]',
      },
      {
        input: 'root = []',
        output: '[]',
      },
    ],
    starterCodePython: `# Definition for a binary tree node.
# class TreeNode:
#     def __init__(self, val=0, left=None, right=None):
#         self.val = val
#         self.left = left
#         self.right = right

class Solution:
    def levelOrder(self, root: Optional[TreeNode]) -> list[list[int]]:
        # TODO: Level order traversal (BFS)
        return []`,
    solutionPython: `from collections import deque

class Solution:
    def levelOrder(self, root: Optional[TreeNode]) -> list[list[int]]:
        if not root:
            return []
        result = []
        queue = deque([root])
        while queue:
            level = []
            for _ in range(len(queue)):
                node = queue.popleft()
                level.append(node.val)
                if node.left:
                    queue.append(node.left)
                if node.right:
                    queue.append(node.right)
            result.append(level)
        return result`,
    starterCodeJava: `import java.util.*;

class Solution {
    public List<List<Integer>> levelOrder(TreeNode root) {
        // TODO: Level order traversal (BFS)
        return new ArrayList<>();
    }
}`,
    solutionJava: `import java.util.*;

class Solution {
    public List<List<Integer>> levelOrder(TreeNode root) {
        List<List<Integer>> result = new ArrayList<>();
        if (root == null) return result;
        Queue<TreeNode> queue = new LinkedList<>();
        queue.offer(root);
        while (!queue.isEmpty()) {
            int size = queue.size(); // All nodes at current depth
            List<Integer> level = new ArrayList<>();
            for (int i = 0; i < size; i++) {
                TreeNode current = queue.poll();
                level.add(current.val);
                if (current.left != null) queue.offer(current.left);
                if (current.right != null) queue.offer(current.right);
            }
            result.add(level);
        }
        return result;
    }
}`,
    starterCodeCpp: `/**
 * Definition for a binary tree node.
 * struct TreeNode {
 *     int val;
 *     TreeNode *left;
 *     TreeNode *right;
 *     TreeNode(int x) : val(x), left(NULL), right(NULL) {}
 * };
 */
#include <vector>
#include <queue>
using namespace std;

class Solution {
public:
    vector<vector<int>> levelOrder(TreeNode* root) {
        // TODO: Level order traversal (BFS)
        return {};
    }
};`,
    solutionCpp: `#include <vector>
#include <queue>
using namespace std;

class Solution {
public:
    vector<vector<int>> levelOrder(TreeNode* root) {
        vector<vector<int>> result;
        if (!root) return result;
        queue<TreeNode*> q;
        q.push(root);
        while (!q.empty()) {
            int size = q.size();
            vector<int> level;
            for (int i = 0; i < size; i++) {
                TreeNode* node = q.front();
                q.pop();
                level.push_back(node->val);
                if (node->left) q.push(node->left);
                if (node->right) q.push(node->right);
            }
            result.push_back(level);
        }
        return result;
    }
};`,
    starterCodeJs: `function levelOrder(root) {
  // TODO: Level order traversal (BFS)
  return [];
}`,
    solutionJs: `function levelOrder(root) {
  const result = [];
  if (!root) return result;
  const queue = [root];
  while (queue.length > 0) {
    const size = queue.length; // All nodes at current depth
    const level = [];
    for (let i = 0; i < size; i++) {
      const node = queue.shift();
      level.push(node.val);
      if (node.left) queue.push(node.left);
      if (node.right) queue.push(node.right);
    }
    result.push(level);
  }
  return result;
}`,
    starterCodeTs: `class TreeNode {
  val: number;
  left: TreeNode | null;
  right: TreeNode | null;
  constructor(val?: number, left?: TreeNode | null, right?: TreeNode | null) {
    this.val = val === undefined ? 0 : val;
    this.left = left === undefined ? null : left;
    this.right = right === undefined ? null : right;
  }
}

function levelOrder(root: TreeNode | null): number[][] {
  // TODO: Level order traversal (BFS)
  return [];
}`,
    solutionTs: `function levelOrder(root: TreeNode | null): number[][] {
  const result: number[][] = [];
  if (!root) return result;
  const queue: TreeNode[] = [root];
  while (queue.length > 0) {
    const size = queue.length;
    const level: number[] = [];
    for (let i = 0; i < size; i++) {
      const node = queue.shift()!;
      level.push(node.val);
      if (node.left) queue.push(node.left);
      if (node.right) queue.push(node.right);
    }
    result.push(level);
  }
  return result;
}`,
    starterCodeGo: `package main

type TreeNode struct {
    Val   int
    Left  *TreeNode
    Right *TreeNode
}

func levelOrder(root *TreeNode) [][]int {
    // TODO: Level order traversal (BFS)
    return [][]int{}
}`,
    solutionGo: `package main

func levelOrder(root *TreeNode) [][]int {
    if root == nil {
        return [][]int{}
    }
    result := [][]int{}
    queue := []*TreeNode{root}
    for len(queue) > 0 {
        size := len(queue)
        level := make([]int, size)
        for i := 0; i < size; i++ {
            node := queue[0]
            queue = queue[1:]
            level[i] = node.Val
            if node.Left != nil {
                queue = append(queue, node.Left)
            }
            if node.Right != nil {
                queue = append(queue, node.Right)
            }
        }
        result = append(result, level)
    }
    return result
}`,
    solutionApproach:
      'We use Breadth-First Search (BFS) with a FIFO Queue. Before processing each level, we take `queue.size()`. This freeze-frames the exact number of nodes at the current depth. We loop through exactly `size` elements, collect their values into a list for that level, and enqueue their children for the next depth.',
    timeComplexity: 'O(n)',
    spaceComplexity: 'O(n) (up to n/2 nodes at leaf level)',
    hints: [
      'Level order traversal naturally corresponds to Breadth-First Search (BFS).',
      'How can you tell when one level ends and the next begins? (Check queue.size() before processing the level).',
    ],
  },
  {
    id: 'merge-intervals',
    title: 'Merge Intervals',
    category: 'Intervals & Sorting',
    difficulty: 'Medium',
    description:
      'Given an array of intervals where intervals[i] = [starti, endi], merge all overlapping intervals, and return an array of the non-overlapping intervals that cover all the intervals in the input.',
    constraints: [
      '1 <= intervals.length <= 10^4',
      'intervals[i].length == 2',
      '0 <= starti <= endi <= 10^4',
    ],
    examples: [
      {
        input: 'intervals = [[1,3],[2,6],[8,10],[15,18]]',
        output: '[[1,6],[8,10],[15,18]]',
        explanation: 'Intervals [1,3] and [2,6] overlap, so they are merged into [1,6].',
      },
      {
        input: 'intervals = [[1,4],[4,5]]',
        output: '[[1,5]]',
        explanation: 'Intervals [1,4] and [4,5] touch at 4, so they are considered overlapping.',
      },
    ],
    starterCodePython: `class Solution:
    def merge(self, intervals: list[list[int]]) -> list[list[int]]:
        # TODO: Merge overlapping intervals
        return []`,
    solutionPython: `class Solution:
    def merge(self, intervals: list[list[int]]) -> list[list[int]]:
        intervals.sort(key=lambda x: x[0])
        merged = []
        for interval in intervals:
            if not merged or merged[-1][1] < interval[0]:
                merged.append(interval)
            else:
                merged[-1][1] = max(merged[-1][1], interval[1])
        return merged`,
    starterCodeJava: `import java.util.*;

class Solution {
    public int[][] merge(int[][] intervals) {
        // TODO: Merge overlapping intervals
        return new int[][] {};
    }
}`,
    solutionJava: `import java.util.*;

class Solution {
    public int[][] merge(int[][] intervals) {
        if (intervals.length <= 1) return intervals;
        // 1. Sort intervals by start time
        Arrays.sort(intervals, (a, b) -> Integer.compare(a[0], b[0]));
        List<int[]> result = new ArrayList<>();
        int[] current = intervals[0];
        result.add(current);
        
        for (int[] interval : intervals) {
            if (interval[0] <= current[1]) {
                // Overlap: extend end bound
                current[1] = Math.max(current[1], interval[1]);
            } else {
                // Disjoint: start new interval
                current = interval;
                result.add(current);
            }
        }
        return result.toArray(new int[result.size()][]);
    }
}`,
    starterCodeCpp: `#include <vector>
#include <algorithm>
using namespace std;

class Solution {
public:
    vector<vector<int>> merge(vector<vector<int>>& intervals) {
        // TODO: Merge overlapping intervals
        return {};
    }
};`,
    solutionCpp: `#include <vector>
#include <algorithm>
using namespace std;

class Solution {
public:
    vector<vector<int>> merge(vector<vector<int>>& intervals) {
        if (intervals.empty()) return {};
        sort(intervals.begin(), intervals.end());
        vector<vector<int>> merged;
        merged.push_back(intervals[0]);
        for (int i = 1; i < intervals.size(); i++) {
            if (merged.back()[1] >= intervals[i][0]) {
                merged.back()[1] = max(merged.back()[1], intervals[i][1]);
            } else {
                merged.push_back(intervals[i]);
            }
        }
        return merged;
    }
};`,
    starterCodeJs: `function merge(intervals) {
  // TODO: Merge overlapping intervals
  return [];
}`,
    solutionJs: `function merge(intervals) {
  if (intervals.length <= 1) return intervals;
  // 1. Sort intervals by start time
  intervals.sort((a, b) => a[0] - b[0]);
  const result = [intervals[0]];
  for (let i = 1; i < intervals.length; i++) {
    const current = intervals[i];
    const prev = result[result.length - 1];
    if (current[0] <= prev[1]) {
      // Overlap: extend end bound
      prev[1] = Math.max(prev[1], current[1]);
    } else {
      // Disjoint: append new interval
      result.push(current);
    }
  }
  return result;
}`,
    starterCodeTs: `function merge(intervals: number[][]): number[][] {
  // TODO: Merge overlapping intervals
  return [];
}`,
    solutionTs: `function merge(intervals: number[][]): number[][] {
  if (intervals.length <= 1) return intervals;
  intervals.sort((a, b) => a[0] - b[0]);
  const result: number[][] = [intervals[0]];
  for (let i = 1; i < intervals.length; i++) {
    const current = intervals[i];
    const prev = result[result.length - 1];
    if (current[0] <= prev[1]) {
      prev[1] = Math.max(prev[1], current[1]);
    } else {
      result.push(current);
    }
  }
  return result;
}`,
    starterCodeGo: `package main

func merge(intervals [][]int) [][]int {
    // TODO: Merge overlapping intervals
    return [][]int{}
}`,
    solutionGo: `package main

import "sort"

func merge(intervals [][]int) [][]int {
    if len(intervals) <= 1 {
        return intervals
    }
    sort.Slice(intervals, func(i, j int) bool {
        return intervals[i][0] < intervals[j][0]
    })
    merged := [][]int{intervals[0]}
    for i := 1; i < len(intervals); i++ {
        curr := intervals[i]
        last := &merged[len(merged)-1]
        if curr[0] <= (*last)[1] {
            if curr[1] > (*last)[1] {
                (*last)[1] = curr[1]
            }
        } else {
            merged = append(merged, curr)
        }
    }
    return merged
}`,
    solutionApproach:
      'First sort the intervals by start time. Once sorted, any intervals that can be merged must appear contiguously. We maintain the current merged interval. For each incoming interval: if its start is less than or equal to current.end, an overlap occurs and we extend current.end = max(current.end, interval.end). Otherwise, no overlap occurs, so we push interval as the new current.',
    timeComplexity: 'O(n log n) due to sorting',
    spaceComplexity: 'O(n) for the output list',
    hints: [
      'If intervals are sorted by their start time, which intervals can potentially overlap?',
      'When two intervals [a, b] and [c, d] overlap (c <= b), what is their merged interval? [a, max(b, d)].',
    ],
  },
  {
    id: 'trapping-rain-water',
    title: 'Trapping Rain Water',
    category: 'Dynamic Programming & Two Pointers',
    difficulty: 'Hard',
    description:
      'Given n non-negative integers representing an elevation map where the width of each bar is 1, compute how much water it can trap after raining.',
    constraints: [
      'n == height.length',
      '1 <= n <= 2 * 10^4',
      '0 <= height[i] <= 10^5',
    ],
    examples: [
      {
        input: 'height = [0,1,0,2,1,0,1,3,2,1,2,1]',
        output: '6',
        explanation: 'The elevation map traps 6 units of rain water between peaks.',
      },
      {
        input: 'height = [4,2,0,3,2,5]',
        output: '9',
      },
    ],
    starterCodePython: `class Solution:
    def trap(self, height: list[int]) -> int:
        # TODO: Calculate total trapped rain water
        return 0`,
    solutionPython: `class Solution:
    def trap(self, height: list[int]) -> int:
        if not height:
            return 0
        left, right = 0, len(height) - 1
        left_max, right_max = 0, 0
        water = 0
        while left < right:
            if height[left] < height[right]:
                if height[left] >= left_max:
                    left_max = height[left]
                else:
                    water += left_max - height[left]
                left += 1
            else:
                if height[right] >= right_max:
                    right_max = height[right]
                else:
                    water += right_max - height[right]
                right -= 1
        return water`,
    starterCodeJava: `class Solution {
    public int trap(int[] height) {
        // TODO: Calculate total trapped rain water
        return 0;
    }
}`,
    solutionJava: `class Solution {
    public int trap(int[] height) {
        int left = 0, right = height.length - 1;
        int leftMax = 0, rightMax = 0;
        int totalWater = 0;
        while (left < right) {
            if (height[left] < height[right]) {
                if (height[left] >= leftMax) {
                    leftMax = height[left];
                } else {
                    totalWater += leftMax - height[left];
                }
                left++;
            } else {
                if (height[right] >= rightMax) {
                    rightMax = height[right];
                } else {
                    totalWater += rightMax - height[right];
                }
                right--;
            }
        }
        return totalWater;
    }
}`,
    starterCodeCpp: `#include <vector>
#include <algorithm>
using namespace std;

class Solution {
public:
    int trap(vector<int>& height) {
        // TODO: Calculate total trapped rain water
        return 0;
    }
};`,
    solutionCpp: `#include <vector>
#include <algorithm>
using namespace std;

class Solution {
public:
    int trap(vector<int>& height) {
        int left = 0, right = height.size() - 1;
        int leftMax = 0, rightMax = 0, total = 0;
        while (left < right) {
            if (height[left] < height[right]) {
                if (height[left] >= leftMax) leftMax = height[left];
                else total += leftMax - height[left];
                left++;
            } else {
                if (height[right] >= rightMax) rightMax = height[right];
                else total += rightMax - height[right];
                right--;
            }
        }
        return total;
    }
};`,
    starterCodeJs: `function trap(height) {
  // TODO: Calculate total trapped rain water
  return 0;
}`,
    solutionJs: `function trap(height) {
  let left = 0, right = height.length - 1;
  let leftMax = 0, rightMax = 0;
  let totalWater = 0;
  while (left < right) {
    if (height[left] < height[right]) {
      if (height[left] >= leftMax) {
        leftMax = height[left];
      } else {
        totalWater += leftMax - height[left];
      }
      left++;
    } else {
      if (height[right] >= rightMax) {
        rightMax = height[right];
      } else {
        totalWater += rightMax - height[right];
      }
      right--;
    }
  }
  return totalWater;
}`,
    starterCodeTs: `function trap(height: number[]): number {
  // TODO: Calculate total trapped rain water
  return 0;
}`,
    solutionTs: `function trap(height: number[]): number {
  let left = 0, right = height.length - 1;
  let leftMax = 0, rightMax = 0;
  let totalWater = 0;
  while (left < right) {
    if (height[left] < height[right]) {
      if (height[left] >= leftMax) {
        leftMax = height[left];
      } else {
        totalWater += leftMax - height[left];
      }
      left++;
    } else {
      if (height[right] >= rightMax) {
        rightMax = height[right];
      } else {
        totalWater += rightMax - height[right];
      }
      right--;
    }
  }
  return totalWater;
}`,
    starterCodeGo: `package main

func trap(height []int) int {
    // TODO: Calculate total trapped rain water
    return 0
}`,
    solutionGo: `package main

func trap(height []int) int {
    left, right := 0, len(height)-1
    leftMax, rightMax, water := 0, 0, 0
    for left < right {
        if height[left] < height[right] {
            if height[left] >= leftMax {
                leftMax = height[left]
            } else {
                water += leftMax - height[left]
            }
            left++
        } else {
            if height[right] >= rightMax {
                rightMax = height[right]
            } else {
                water += rightMax - height[right]
            }
            right--
        }
    }
    return water
}`,
    solutionApproach:
      'The water trapped above bar i is min(maxLeft, maxRight) - height[i]. With Two Pointers (`left = 0`, `right = n-1`), we advance the pointer with the smaller height. If height[left] < height[right], we know for sure that leftMax is the bottleneck (since right is flanked by an even taller or equal bar), so trapped water depends purely on leftMax. This eliminates the need for O(n) prefix/suffix arrays, yielding O(1) auxiliary space.',
    timeComplexity: 'O(n)',
    spaceComplexity: 'O(1)',
    hints: [
      'At any position i, how much water can be trapped? (min(max_left, max_right) - height[i]).',
      'Can you use two pointers from both ends to track leftMax and rightMax without pre-allocating arrays?',
      'Always advance the pointer with the smaller height because it is the limiting factor.',
    ],
  },
];
