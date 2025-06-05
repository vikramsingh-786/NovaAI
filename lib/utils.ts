export function formatDate(dateString: string | Date): string {
  const date = new Date(dateString);
  const now = new Date();
  
  const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diffInDays === 0) {
    return 'Today';
  } else if (diffInDays === 1) {
    return 'Yesterday';
  } else if (diffInDays < 7) {
    return `${diffInDays} days ago`;
  } else {
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }
}

export function truncateString(str: string, maxLength: number = 50): string {
  if (str.length <= maxLength) return str;
  return str.substring(0, maxLength) + '...';
}

export async function rateLimit(): Promise<boolean> {
  return false; 
}

export function detectCodeInMessage(message: string): boolean {
  return message.includes('```') || 
         message.includes('function') || 
         message.includes('const ') || 
         message.includes('let ') || 
         message.includes('var ');
}