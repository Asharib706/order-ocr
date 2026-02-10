import streamlit as st
import pandas as pd
from PIL import Image
import io
import time
import os
from ocr_utils import extract_work_order_data
from db_utils import insert_work_orders, FRAMEWORK_DB_SCHEMA, get_supabase_client
from dotenv import load_dotenv

load_dotenv()

st.set_page_config(page_title="Work Order OCR", layout="wide")

st.title("Work Order OCR Implementation")

# Sidebar for configuration
with st.sidebar:
    st.header("Configuration")
    if not get_supabase_client():
        st.warning("Supabase not configured. Data saving will be disabled.")
        st.code(FRAMEWORK_DB_SCHEMA, language="sql")
        st.info("Add your SUPABASE_URL and SUPABASE_KEY to .env file.")
        
        # Helper to check headers
        if not os.getenv("SUPABASE_URL"):
            st.error("Missing SUPABASE_URL in .env")
        if not os.getenv("SUPABASE_KEY"):
            st.error("Missing SUPABASE_KEY in .env")
    else:
        st.success("Supabase Connected")

# Main Interface
st.subheader("Upload Work Orders")
uploaded_files = st.file_uploader("Choose images...", accept_multiple_files=True, type=['png', 'jpg', 'jpeg', 'webp'])

if uploaded_files:
    if st.button("Process Images"):
        progress_bar = st.progress(0)
        status_text = st.empty()
        
        extracted_data = []
        
        for i, uploaded_file in enumerate(uploaded_files):
            status_text.text(f"Processing {uploaded_file.name}...")
            
            # Convert to PIL Image
            image = Image.open(uploaded_file)
            
            # OCR Extraction
            data = extract_work_order_data(image)
            
            if data:
                data['filename'] = uploaded_file.name
                extracted_data.append(data)
            else:
                st.error(f"Failed to extract data from {uploaded_file.name}")
            
            progress_bar.progress((i + 1) / len(uploaded_files))
            
        status_text.text("Processing Complete!")
        
        if extracted_data:
            st.session_state['extracted_data'] = extracted_data
            st.rerun()

# Display Results
if 'extracted_data' in st.session_state and st.session_state['extracted_data']:
    st.divider()
    st.subheader("Extracted Data")
    
    df = pd.DataFrame(st.session_state['extracted_data'])
    
    # Reorder columns if possible
    preferred_order = ['work_order_number', 'job_number', 'date', 'hours', 'signed_by_both', 'customer_sign', 'wcdp_sign', 'description', 'filename']
    columns = [c for c in preferred_order if c in df.columns] + [c for c in df.columns if c not in preferred_order]
    df = df[columns]
    
    edited_df = st.data_editor(df, num_rows="dynamic")
    
    col1, col2 = st.columns(2)
    
    # Save to Database
    with col1:
        if st.button("Save to Supabase"):
            if get_supabase_client():
                # Convert DataFrame to list of dicts for insertion
                records = edited_df.drop(columns=['filename'], errors='ignore').to_dict('records')
                
                with st.spinner("Saving to database..."):
                    result = insert_work_orders(records)
                
                if isinstance(result, dict) and "error" in result:
                    st.error(f"Error saving to DB: {result['error']}")
                else:
                    st.success(f"Successfully saved {len(records)} records!")
            else:
                st.error("Supabase is not configured.")

    # Download Excel
    with col2:
        output = io.BytesIO()
        with pd.ExcelWriter(output, engine='openpyxl') as writer:
            edited_df.to_excel(writer, index=False, sheet_name='Work Orders')
        
        st.download_button(
            label="Download Excel",
            data=output.getvalue(),
            file_name="extracted_work_orders.xlsx",
            mime="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        )
