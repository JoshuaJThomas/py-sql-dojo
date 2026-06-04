/**
 * Lightweight, regex-based Markdown parser to safely format basic
 * markdown elements into CSS-styled HTML tags for our cyber-theme.
 */
export function parseMarkdown(text) {
  if (!text) return "";
  
  // Escape HTML characters to prevent XSS
  let escaped = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  
  // Bold: **text**
  escaped = escaped.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
  
  // Italics: *text*
  escaped = escaped.replace(/\*(.*?)\*/g, "<em>$1</em>");
  
  // Code block: ```code```
  escaped = escaped.replace(/```([\s\S]*?)```/g, "<pre class=\"md-code-block\"><code>$1</code></pre>");
  
  // Inline Code: `code`
  escaped = escaped.replace(/`([^`]+)`/g, "<code class=\"md-inline-code\">$1</code>");
  
  // Links: [label](url)
  escaped = escaped.replace(/\[([^\]]+)\]\(([^)]+)\)/g, "<a href=\"$2\" target=\"_blank\" class=\"md-link\">$1</a>");
  
  // Newlines to <br/>
  escaped = escaped.replace(/\n/g, "<br/>");
  
  return escaped;
}
