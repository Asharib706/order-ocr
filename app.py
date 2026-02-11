import streamlit as st
import pandas as pd
from PIL import Image
import io
import time
import os
import fitz  # PyMuPDF
from ocr_utils import extract_work_order_data
from db_utils import insert_work_orders, FRAMEWORK_DB_SCHEMA, get_supabase_client
from dotenv import load_dotenv

load_dotenv()

st.set_page_config(page_title="Work Order OCR", layout="wide")

# Load Custom CSS
with open("style.css") as f:
    st.markdown(f"<style>{f.read()}</style>", unsafe_allow_html=True)

st.title("📄 Work Order OCR")
st.markdown("Upload your work orders (PDF or Images) to extract data automatically.")

# Sidebar for configuration
with st.sidebar:
    st.header("⚙️ Configuration")
    if not os.getenv("DATABASE_URL") and not os.getenv("SUPABASE_URL"):
        st.warning("Database not configured.")
        st.info("Add DATABASE_URL or SUPABASE_URL/KEY to .env file.")
    else:
        st.success("Database Connected")

# Main Interface
st.divider()
st.subheader("📤 Upload Files")

col_type, col_upload = st.columns([1, 3])
with col_type:
    file_type = st.radio("Select File Type", ["PDF", "Images"], horizontal=False)

with col_upload:
    if file_type == "Images":
        uploaded_files = st.file_uploader("Choose images...", accept_multiple_files=True, type=['png', 'jpg', 'jpeg', 'webp'])
    else:
        uploaded_files = st.file_uploader("Choose PDF file(s)...", accept_multiple_files=True, type=['pdf'])

if uploaded_files:
    if st.button("🚀 Process Files", type="primary"):
        extracted_data = []
        total_files = len(uploaded_files)
        
        # Modern Status Container
        with st.status("Processing files...", expanded=True) as status:
            for i, uploaded_file in enumerate(uploaded_files):
                status.write(f"Processing **{uploaded_file.name}** ({i+1}/{total_files})...")
                
                if file_type == "Images":
                    try:
                        image = Image.open(uploaded_file)
                        data = extract_work_order_data(image)
                        if data:
                            data['filename'] = uploaded_file.name
                            extracted_data.append(data)
                        else:
                            st.warning(f"Failed to extract data from {uploaded_file.name}")
                    except Exception as e:
                        st.error(f"Error processing {uploaded_file.name}: {e}")
                        
                elif file_type == "PDF":
                    try:
                        pdf_bytes = uploaded_file.read()
                        pdf_document = fitz.open(stream=pdf_bytes, filetype="pdf")
                        
                        for page_num in range(len(pdf_document)):
                            status.write(f"&nbsp;&nbsp;&nbsp;↳ Converting Page {page_num + 1}...")
                            page = pdf_document.load_page(page_num)
                            pix = page.get_pixmap()
                            img_data = pix.tobytes("png")
                            image = Image.open(io.BytesIO(img_data))
                            
                            data = extract_work_order_data(image)
                            if data:
                                data['filename'] = f"{uploaded_file.name} - Page {page_num + 1}"
                                extracted_data.append(data)
                    except Exception as e:
                        st.error(f"Error processing {uploaded_file.name}: {e}")

            status.update(label="Processing Complete!", state="complete", expanded=False)
        
        if extracted_data:
            st.session_state['extracted_data'] = extracted_data
            st.rerun()

# Display Results
if 'extracted_data' in st.session_state and st.session_state['extracted_data']:
    st.divider()
    st.subheader("✅ Extracted Data")
    
    df = pd.DataFrame(st.session_state['extracted_data'])
    
    # Reorder columns
    preferred_order = ['work_order_number', 'job_number', 'date', 'hours', 'total_amount_due', 'signed_by_both', 'customer_sign', 'wcdp_sign', 'description', 'filename']
    columns = [c for c in preferred_order if c in df.columns] + [c for c in df.columns if c not in preferred_order]
    df = df[columns]
    
    # Metrics
    m1, m2, m3 = st.columns(3)
    m1.metric("Items Extracted", len(df))
    m2.metric("Total Hours", pd.to_numeric(df['hours'], errors='coerce').sum())
    m3.metric("Fully Signed", f"{(df['signed_by_both'].sum() / len(df) * 100):.1f}%" if len(df) > 0 else "0%")

    # Styled Editor
    edited_df = st.data_editor(
        df,
        num_rows="dynamic",
        use_container_width=True,
        column_config={
            "signed_by_both": st.column_config.CheckboxColumn("Both Signed", help="Both WCDP and Customer signatures present"),
            "customer_sign": st.column_config.CheckboxColumn("Customer", help="Customer signature present"),
            "wcdp_sign": st.column_config.CheckboxColumn("WCDP", help="WCDP signature present"),
            "hours": st.column_config.NumberColumn("Hours", format="%.2f"),
            "total_amount_due": st.column_config.NumberColumn("Total Due", format="$%.2f"),
            "description": st.column_config.TextColumn("Description", width="small"),
        }
    )
    
    col1, col2 = st.columns(2)
    
    # Save to Database
    with col1:
        if st.button("💾 Save to Database", type="primary"):
            if get_supabase_client():
                records = edited_df.drop(columns=['filename'], errors='ignore').to_dict('records')
                with st.spinner("Saving to database..."):
                    result = insert_work_orders(records)
                
                if isinstance(result, dict) and "error" in result:
                    st.error(f"Error: {result['error']}")
                else:
                    st.success(f"Successfully saved {len(records)} records!")
                    st.balloons()
            else:
                st.error("Supabase is not configured.")

    # Download Excel
    with col2:
        output = io.BytesIO()
        with pd.ExcelWriter(output, engine='openpyxl') as writer:
            edited_df.to_excel(writer, index=False, sheet_name='Work Orders')
        
        st.download_button(
            label="📥 Download Excel",
            data=output.getvalue(),
            file_name="extracted_work_orders.xlsx",
            mime="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        )
