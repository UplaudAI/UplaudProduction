export async function fetchAirtableUsers() {
  const tableName = import.meta.env.VITE_AIRTABLE_TABLE_NAME;

  const response = await fetch(`/api/airtable/${tableName}`);

  if (!response.ok) {
    throw new Error("Failed to fetch Airtable data");
  }

  const data = await response.json();
  return data.records.map((record) => ({
    id: record.id,
    name: record.fields.name || "Unnamed",
    xp: record.fields.xp || 0,
    reviews: record.fields.reviews || 0,
    avatar: record.fields.avatar || `https://i.pravatar.cc/100?u=${record.id}`
  }));
}
