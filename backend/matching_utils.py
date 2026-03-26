from sentence_transformers import SentenceTransformer, util
import torch

# Initialize the sentence transformer model
# Using paraphrase-MiniLM-L6-v2 for efficient and accurate semantic similarity
try:
    model = SentenceTransformer('paraphrase-MiniLM-L6-v2')
except Exception as e:
    print(f"Error loading Matching model: {e}")
    model = None

def compute_semantic_similarity(mse_text: str, snp_text: str) -> float:
    """
    Computes semantic similarity score (0.0 to 1.0) between MSE and SNP descriptions.
    """
    if model is None:
        return 0.0

    try:
        # Encode sentences to get embeddings
        embedding1 = model.encode(mse_text, convert_to_tensor=True)
        embedding2 = model.encode(snp_text, convert_to_tensor=True)

        # Compute cosine similarity
        cosine_scores = util.cos_sim(embedding1, embedding2)
        
        # Extract scalar value
        score = cosine_scores.item()
        
        # Ensure score is between 0 and 1
        return max(0.0, min(1.0, score))
    except Exception as e:
        print(f"Semantic Similarity Error: {e}")
        return 0.0

if __name__ == "__main__":
    # Test
    mse_profile = "Handwoven cotton sarees from Varanasi. Traditional silk weaving."
    snp_profile = "Logistics for textiles and handicrafts. Pan-India delivery for weavers."
    unrelated_snp = "Cold storage for fresh vegetables and dairy products."
    
    print(f"Testing Semantic Matching...")
    score1 = compute_semantic_similarity(mse_profile, snp_profile)
    print(f"Match (Textiles <-> Logistics): {score1:.4f}")
    
    score2 = compute_semantic_similarity(mse_profile, unrelated_snp)
    print(f"Match (Textiles <-> Cold Storage): {score2:.4f}")
