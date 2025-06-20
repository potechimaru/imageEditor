export const fetchHistory = async (userId: string): Promise<string[]> => {
  const res = await fetch("http://localhost:8000/api/history?user_id=" + userId);
  const data = await res.json();
  return data.image_urls; // backendと合わせてこの形式
};