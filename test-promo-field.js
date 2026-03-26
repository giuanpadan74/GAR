// Script per testare il campo promoPrezzo nel database
import { supabase } from './services/supabaseClient.js';

async function testPromoField() {
  console.log('🔍 Testing promoPrezzo field...');
  
  try {
    // 1. Prova a fare una query per vedere la struttura della tabella
    console.log('📋 Checking table structure...');
    const { data: products, error: selectError } = await supabase
      .from('products')
      .select('id, promoPrezzo, promoDAL, promoAL')
      .limit(1);
    
    if (selectError) {
      console.error('❌ Error selecting with promoPrezzo:', selectError);
      
      // Prova con il nome vecchio
      console.log('🔄 Trying with old field name promoPREZZO...');
      const { data: productsOld, error: selectErrorOld } = await supabase
        .from('products')
        .select('id, promoPREZZO, promoDAL, promoAL')
        .limit(1);
        
      if (selectErrorOld) {
        console.error('❌ Error selecting with promoPREZZO:', selectErrorOld);
      } else {
        console.log('✅ Found products with promoPREZZO field:', productsOld);
      }
    } else {
      console.log('✅ Found products with promoPrezzo field:', products);
    }
    
    // 2. Prova a fare un update di test
    if (products && products.length > 0) {
      const testProductId = products[0].id;
      console.log(`🧪 Testing update on product ${testProductId}...`);
      
      const { data: updateData, error: updateError } = await supabase
        .from('products')
        .update({ promoPrezzo: 99.99 })
        .eq('id', testProductId)
        .select('id, promoPrezzo')
        .single();
        
      if (updateError) {
        console.error('❌ Error updating promoPrezzo:', updateError);
      } else {
        console.log('✅ Successfully updated promoPrezzo:', updateData);
      }
    }
    
  } catch (error) {
    console.error('💥 Unexpected error:', error);
  }
}

testPromoField();