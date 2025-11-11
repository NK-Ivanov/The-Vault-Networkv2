import { supabase } from "@/integrations/supabase/client";

/**
 * Gets or creates "The Vault Network" seller account
 * This is a special system seller account for clients who sign up without a referral code
 */
export async function getOrCreateVaultNetworkSeller() {
  const VAULT_NETWORK_REFERRAL_CODE = "VAULT-NETWORK";
  
  // First, try to find existing Vault Network seller
  const { data: existingSeller, error: findError } = await supabase
    .from("sellers")
    .select("id")
    .eq("referral_code", VAULT_NETWORK_REFERRAL_CODE)
    .maybeSingle();

  if (findError && findError.code !== 'PGRST116') { // PGRST116 = no rows returned
    console.error("Error finding Vault Network seller:", findError);
    throw findError;
  }

  if (existingSeller) {
    return existingSeller.id;
  }

  // If not found, we need to create it
  // Note: This requires admin privileges or a database function
  // For now, we'll return null and handle creation via SQL migration
  // The admin should run a migration to create this seller account
  console.warn("Vault Network seller account not found. Please create it via SQL migration.");
  return null;
}

