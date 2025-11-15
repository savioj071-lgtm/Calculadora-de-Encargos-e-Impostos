document.addEventListener('DOMContentLoaded', () => {

    const VALOR_POR_DEPENDENTE_IRRF = 189.59;

    const btnModoCLT = document.getElementById('btn-modo-clt');
    const btnModoPJ = document.getElementById('btn-modo-pj');

    const formCLT = document.getElementById('form-clt');
    const formPJ = document.getElementById('form-pj');

    const btnCalcularCLT = document.getElementById('calcular-clt');
    const btnCalcularPJ = document.getElementById('calcular-pj');

    const relatorioDiv = document.getElementById('relatorio');

    btnModoCLT.addEventListener('click', () => {
        formCLT.style.display = 'block';
        formPJ.style.display = 'none';
        btnModoCLT.classList.add('active');
        btnModoPJ.classList.remove('active');
        relatorioDiv.innerHTML = '';
    });

    btnModoPJ.addEventListener('click', () => {
        formCLT.style.display = 'none';
        formPJ.style.display = 'block';
        btnModoCLT.classList.remove('active');
        btnModoPJ.classList.add('active');
        relatorioDiv.innerHTML = '';
    });

    btnCalcularCLT.addEventListener('click', () => {
        const salarioBruto = parseFloat(document.getElementById('salario-bruto').value);
        const numDependentes = parseInt(document.getElementById('num-dependentes').value);

        if (isNaN(salarioBruto) || salarioBruto <= 0) {
            alert("Por favor, insira um Salário Bruto válido.");
            return;
        }

        const fgts = calcularFGTS(salarioBruto);
        const inss = calcularINSS(salarioBruto);
        const irrf = calcularIRRF(salarioBruto, inss, numDependentes);
        const salarioLiquido = salarioBruto - inss - irrf;

        exibirRelatorioCLT(salarioBruto, fgts, inss, irrf, salarioLiquido);
    });

    btnCalcularPJ.addEventListener('click', () => {
        const faturamento = parseFloat(document.getElementById('faturamento-bruto').value);
        const regime = document.getElementById('regime-pj').value;

        if (isNaN(faturamento) || faturamento <= 0) {
            alert("Por favor, insira um Faturamento Bruto válido.");
            return;
        }

        let resultadoPJ;
        let nomeRegime;

        if (regime === 'simples') {
            resultadoPJ = calcularSimplesNacional(faturamento);
            nomeRegime = "Simples Nacional (Anexo III - 6%)";
        } else {
            resultadoPJ = calcularLucroPresumido(faturamento);
            nomeRegime = "Lucro Presumido (Serviços - 32%)";
        }

        exibirRelatorioPJ(faturamento, nomeRegime, resultadoPJ);
    });

    function calcularFGTS(salario) {
        return salario * 0.08;
    }

    function calcularINSS(salario) {
        let inssTotal = 0;

        const faixas = [
            { teto: 1412.00, aliquota: 0.075 },
            { teto: 2666.68, aliquota: 0.09 },
            { teto: 4000.03, aliquota: 0.12 },
            { teto: 7786.02, aliquota: 0.14 }
        ];

        let salarioRestante = salario;
        let tetoAnterior = 0;

        for (const faixa of faixas) {
            if (salarioRestante <= 0) break;

            let baseFaixa = Math.min(
                salarioRestante,
                faixa.teto - tetoAnterior
            );
            
            if (salario > faixa.teto) {
                 baseFaixa = faixa.teto - tetoAnterior;
            } else {
                 baseFaixa = salario - tetoAnterior;
            }

            if (baseFaixa < 0) baseFaixa = 0;
            
            inssTotal += baseFaixa * faixa.aliquota;
            
            salarioRestante -= baseFaixa;
            tetoAnterior = faixa.teto;
            
            if (salario <= faixa.teto) break;
        }
        
        const tetoINSS = (1412.00 * 0.075) + 
                         (2666.68 - 1412.00) * 0.09 + 
                         (4000.03 - 2666.68) * 0.12 + 
                         (7786.02 - 4000.03) * 0.14;

        return Math.min(inssTotal, tetoINSS);
    }

    function calcularIRRF(salario, inss, dependentes) {
        const deducaoDependentes = dependentes * VALOR_POR_DEPENDENTE_IRRF;
        const baseCalculo = salario - inss - deducaoDependentes;

        let irrf = 0;

        if (baseCalculo <= 2259.20) {
            irrf = 0;
        } else if (baseCalculo <= 2826.65) {
            irrf = (baseCalculo * 0.075) - 169.44;
        } else if (baseCalculo <= 3751.05) {
            irrf = (baseCalculo * 0.15) - 381.44;
        } else if (baseCalculo <= 4664.68) {
            irrf = (baseCalculo * 0.225) - 662.77;
        } else {
            irrf = (baseCalculo * 0.275) - 896.00;
        }

        return irrf < 0 ? 0 : irrf;
    }

    function calcularSimplesNacional(faturamento) {
        const impostoTotal = faturamento * 0.06;
        const lucroLiquido = faturamento - impostoTotal;
        return { impostoTotal, lucroLiquido };
    }

    function calcularLucroPresumido(faturamento) {
        const pis = faturamento * 0.0065;
        const cofins = faturamento * 0.03;
        const iss = faturamento * 0.05;

        const basePresumida = faturamento * 0.32;
        
        const irpj = basePresumida * 0.15;
        const csll = basePresumida * 0.09;

        const impostoTotal = pis + cofins + iss + irpj + csll;
        const lucroLiquido = faturamento - impostoTotal;

        return { impostoTotal, lucroLiquido, detalhes: { pis, cofins, iss, irpj, csll } };
    }

    function formatCurrency(value) {
        return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    }

    function exibirRelatorioCLT(bruto, fgts, inss, irrf, liquido) {
        const resultadoHTML = `
            <h3>Relatório do Cálculo CLT</h3>
            <p>
                Salário Bruto:
                <span>${formatCurrency(bruto)}</span>
            </p>
            <p class="text-muted">
                FGTS (Pago pela Empresa):
                <span>${formatCurrency(fgts)}</span>
            </p>
            <hr>
            <p class="text-danger">
                (-) Desconto INSS:
                <span>${formatCurrency(inss)}</span>
            </p>
            <p class="text-danger">
                (-) Desconto IRRF:
                <span>${formatCurrency(irrf)}</span>
            </p>
            <p class="text-success total-liquido">
                (=) Salário Líquido:
                <span>${formatCurrency(liquido)}</span>
            </p>
        `;
        relatorioDiv.innerHTML = resultadoHTML;
    }

    function exibirRelatorioPJ(faturamento, nomeRegime, resultado) {
        let detalhesHTML = '';

        if (resultado.detalhes) {
            detalhesHTML = `
                <p class="text-danger" style="padding-left: 20px;">
                    &nbsp;&nbsp; PIS (0.65%):
                    <span>${formatCurrency(resultado.detalhes.pis)}</span>
                </p>
                <p class="text-danger" style="padding-left: 20px;">
                    &nbsp;&nbsp; COFINS (3%):
                    <span>${formatCurrency(resultado.detalhes.cofins)}</span>
                </p>
                <p class="text-danger" style="padding-left: 20px;">
                    &nbsp;&nbsp; ISS (5%):
                    <span>${formatCurrency(resultado.detalhes.iss)}</span>
                </p>
                <p class="text-danger" style="padding-left: 20px;">
                    &nbsp;&nbsp; IRPJ (15% s/ 32%):
                    <span>${formatCurrency(resultado.detalhes.irpj)}</span>
                </p>
                <p class="text-danger" style="padding-left: 20px;">
                    &nbsp;&nbsp; CSLL (9% s/ 32%):
                    <span>${formatCurrency(resultado.detalhes.csll)}</span>
                </p>
            `;
        }

        const resultadoHTML = `
            <h3>Relatório do Cálculo PJ</h3>
            <p>
                Regime:
                <span>${nomeRegime}</span>
            </p>
             <p>
                Faturamento Bruto:
                <span>${formatCurrency(faturamento)}</span>
            </p>
            <hr>
            <p class="text-danger">
                (-) Total de Impostos Pagos:
                <span>${formatCurrency(resultado.impostoTotal)}</span>
            </p>
            ${detalhesHTML}
            <p class="text-success total-liquido">
                (=) Lucro Líquido (Empresa):
                <span>${formatCurrency(resultado.lucroLiquido)}</span>
            </p>
        `;
        relatorioDiv.innerHTML = resultadoHTML;
    }

});