"""
Este módulo define as rotas da API para operações fiscais,
como a emissão de notas fiscais eletrônicas (NF-e/NFS-e).
Ele utiliza um serviço fiscal (`fiscal_service`) para gerar, assinar e transmitir
os documentos fiscais.
"""

from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel
from typing import Dict, Any, Optional, List
import sys
import os

# Adiciona o diretório pai (backend) ao sys.path para permitir importações relativas.
# Embora funcione, é uma abordagem que pode ser frágil em projetos maiores.
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from services.fiscal_service import fiscal_service # Importa o serviço que lida com a lógica fiscal.

# Cria uma instância de APIRouter com um prefixo e tags para organização na documentação OpenAPI.
router = APIRouter(
    prefix="/api/fiscal",
    tags=["Fiscal"], # Tag para agrupar as rotas fiscais na documentação.
    responses={404: {"description": "Não encontrado"}}, # Resposta padrão para 404.
)

# --- Modelos Pydantic para dados fiscais ---
# Estes modelos definem a estrutura dos dados esperados para as operações fiscais.

class FiscalItem(BaseModel):
    """
    Representa um item de serviço ou produto em uma nota fiscal.
    """
    code: str # Código do item.
    desc: str # Descrição do item.
    qty: float # Quantidade.
    price: float # Preço unitário.
    total: float # Valor total do item (qty * price).

class FiscalAddress(BaseModel):
    """
    Representa um endereço para entidades fiscais.
    """
    street: str # Rua.
    number: str # Número.
    neighborhood: str # Bairro.
    city: str # Cidade.
    state: str # Estado (sigla).
    zip: str # CEP.

class FiscalEntity(BaseModel):
    """
    Representa uma entidade fiscal, como emissor ou recebedor da nota.
    Pode ser pessoa física ou jurídica.
    """
    name: Optional[str] = None # Nome da pessoa física.
    companyName: Optional[str] = None # Razão social da empresa.
    tradeName: Optional[str] = None # Nome fantasia.
    doc: Optional[str] = None # Documento (CPF ou CNPJ), formato genérico.
    cnpj: Optional[str] = None # CNPJ específico (para uso na geração da NF-e).
    ie: Optional[str] = None # Inscrição Estadual.
    address: Optional[FiscalAddress] = None # Endereço da entidade.
    crt: Optional[str] = None # Código de Regime Tributário.

class InvoiceRequest(BaseModel):
    """
    Define a estrutura completa de uma requisição para emissão de nota fiscal.
    """
    type: str # Tipo da nota: "NFE" (Nota Fiscal Eletrônica de Produto) ou "NFSE" (Nota Fiscal de Serviço Eletrônica).
    issuer: FiscalEntity # Dados da entidade emissora da nota.
    recipient: FiscalEntity # Dados da entidade recebedora da nota.
    items: Optional[List[FiscalItem]] = [] # Lista de itens (produtos/serviços) da nota.
    serviceValue: Optional[float] = 0 # Valor total dos serviços (para NFS-e).
    totalValue: float # Valor total geral da nota.
    naturezaOperacao: Optional[str] = None # Natureza da Operação (ex: "Venda de Mercadoria").
    issRetido: Optional[bool] = False # Indica se o ISS foi retido (para NFS-e).

@router.post("/emit")
async def emit_invoice(invoice: InvoiceRequest):
    """
    Endpoint para emitir uma nota fiscal (NF-e ou NFS-e).
    Recebe os dados da nota em formato JSON e processa a emissão.
    """
    try:
        # Converte o modelo Pydantic para um dicionário Python.
        invoice_data = invoice.model_dump()
        
        # Gera um número de nota fiscal (em uma aplicação real, viria de uma sequência no DB).
        import random
        invoice_data['number'] = str(random.randint(1000, 9999)) # Número aleatório para demonstração.
        invoice_data['series'] = "1" # Série da nota.
        
        # 1. Gera o XML da nota fiscal usando o serviço fiscal.
        # O serviço `fiscal_service` abstrai a complexidade da geração do XML conforme a legislação.
        xml = fiscal_service.generate_nfe_xml(invoice_data)
        
        # 2. Assina o XML gerado digitalmente.
        # A assinatura garante a autenticidade e integridade do documento.
        signed_xml = fiscal_service.sign_xml(xml)
        
        # 3. Transmite o XML assinado para a SEFAZ (Secretaria da Fazenda) ou provedor de NFS-e.
        # Este passo simula o envio do documento fiscal para as autoridades competentes.
        result = fiscal_service.transmit_to_sefaz(signed_xml)
        
        return result # Retorna o resultado da transmissão.
        
    except Exception as e:
        # Em caso de erro, levanta um HTTPException 500 com a mensagem de erro.
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Erro ao emitir nota fiscal: {str(e)}")
