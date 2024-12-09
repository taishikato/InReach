-- Enable the pgvector extension to work with embedding vectors
create extension vector;

create table
  public.influencer_vectors (
    id bigserial not null,
    content text null,
    metadata jsonb null,
    embedding extensions.vector null,
    constraint influencer_vectors_pkey primary key (id)
  ) tablespace pg_default;

-- Create a function to search for documents
create function match_influencer_vectors(
  query_embedding vector(1536),
  match_count int DEFAULT null,
  filter jsonb DEFAULT '{}'
) returns table (
  id bigint,
  content text,
  metadata jsonb,
  embedding jsonb,
  similarity float
)
language plpgsql
as $$
#variable_conflict use_column
begin
  return query
  select
    id,
    content,
    metadata,
    (embedding::text)::jsonb as embedding,
    1 - (influencer_vectors.embedding <=> query_embedding) as similarity
  from influencer_vectors
  where metadata @> filter
  order by influencer_vectors.embedding <=> query_embedding
  limit match_count;
end;
$$;
