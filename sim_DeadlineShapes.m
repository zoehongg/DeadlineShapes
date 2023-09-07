% generate fake data for DeadlineShapes

clear all
close all


% basic vars
ntrials = 10000;
shapes = ['hexagon','circle','square','triangle','rectangle','semicircle','heart','star'];
weights = [-0.9, -0.7, -0.5, -0.3, 0.3, 0.5, 0.7, 0.9];
samplingDist_blue = [0.055, 0.11, 0.2, 0.365, 0.18, 0.06, 0.02, 0.01];
samplingDist_red =  [0.01, 0.02, 0.06, 0.18, 0.365, 0.2, 0.11, 0.055];
choiceProbs = [0.5, 0.5];
maxShapes = 20;

% 'model' params
B = 1; % bound for terminating a decision, in units of cumulative logLR 
sigma = 0.3; % st.dev of noise added to momentary evidence


% **** momentary evidence ****
% following the two-accumulator model of Kira et al.,
% the mean M.E. is equal to a given shape's assigned logLR (to be replaced
% with subjective WoE, once we can estimate it from data), sign-flipped for
% the 'blue' accumulator, plus independent Gaussian noise, plus a linear
% urgency signal.

% Could convert this eventually to the multivariate normal formulation of
% Kiani et al., but this is easier to follow.

% Also consider scaling the noise with the mean LLR (signal-dep noise)?


% **** urgency signal ****
% is this fancy thing in Kira et al.:
% u(t) = kappa* [ 1−exp(−(t−tau)^2) / 2*sigma_u^2 ]

% but we can use a linear function for simplicity (see their Fig. 5D)
% note that it stays at zero for a bit before ramping up.
% and also that for simulation it only needs to be computed at the shape
% presentation intervals, not time per se
urgencySlope = 0.02;
u(1:2) = 0;
u(3:maxShapes) = urgencySlope*(1:maxShapes-2);
figure;plot(1:maxShapes,u,'g-');



%% now the simulation

% trialwise independent vars
corrTarg = nan(ntrials,1);
losingDVval = nan(ntrials,1);
hitBound = nan(ntrials,1);
totalEvidence = nan(ntrials,1);
distFromBound = nan(ntrials,1);
% ntrials-by-nshapes vars
shape = nan(ntrials,maxShapes);
DV_red = nan(ntrials,maxShapes);
DV_blue = nan(ntrials,maxShapes);
% trialwise dependent vars
choice = nan(ntrials,1);
RT = nan(ntrials,1);
conf = nan(ntrials,1);

for n = 1:ntrials % index of trial number
    corrTarg(n) = sample(choiceProbs) - 1; % 0 = blue (neg), 1 = red (pos)
    for s = 1:maxShapes
        if corrTarg(n) == 0
            shape(n,s) = sample(samplingDist_blue);
        else % 1
            shape(n,s) = sample(samplingDist_red);
        end        
        % increment the DVs
        if s==1
            DV_blue(n,s) = -weights(shape(n,s)) + randn*sigma + u(s);
            DV_red(n,s)  =  weights(shape(n,s)) + randn*sigma + u(s);
        else
            DV_blue(n,s) = DV_blue(n,s-1) - weights(shape(n,s)) + randn*sigma + u(s);
            DV_red(n,s)  = DV_red(n,s-1)  + weights(shape(n,s)) + randn*sigma + u(s);
        end
    end

% % temp: sanity check (don't run it in a loop! only in debug mode or with n=1)
%     figure(23); clf; plot(1:maxShapes,DV_blue(n,:),'b-',1:maxShapes,DV_red(n,:),'r-');
%     ylim([-B*1.2 B*1.2]);

    % decision outcome
    cRTblue = find(DV_blue(n,:)>=B, 1); % time of first bound crossing(s):
    cRTred = find(DV_red(n,:)>=B, 1);
    
    % the possibilities are:
    % (1) only the 'blue' accumulator hits bound,
    if ~isempty(cRTblue) && isempty(cRTred)
        RT(n) = cRTblue;
        losingDVval(n) = DV_red(n,RT(n)); % only blue hit, so red is the loser
        hitBound(n) = 1;
        choice(n) = 0;
    % (2) only the 'red' accumulator hits bound,
    elseif isempty(cRTblue) && ~isempty(cRTred)
        RT(n) = cRTred;
        losingDVval(n) = DV_blue(n,RT(n)); % only red hit, so blue is the loser
        hitBound(n) = 1;
        choice(n) = 1;
    % (3) neither hits bound,
    elseif isempty(cRTblue) && isempty(cRTred)
        hitBound(n) = 0;
        RT(n) = maxShapes;
        if DV_blue(n,RT(n)) > DV_red(n,RT(n)) % blue wins, 
            choice(n) = 0;
            losingDVval(n) = DV_red(n,RT(n)); % so red is loser.
        elseif DV_red(n,RT(n)) > DV_blue(n,RT(n)) % red wins,
            choice(n) = 1;
            losingDVval(n) = DV_blue(n,RT(n)); % so blue is loser
        else % should only happen when there's no noise! add some.
            keyboard
        end
    % (4) or both do
    else
        RT(n) = min([cRTblue cRTred]);
        if DV_blue(n,RT(n)) > DV_red(n,RT(n)) % blue wins,
            choice(n) = 0;
            losingDVval(n) = DV_red(n,RT(n)); % so red is loser
        elseif DV_red(n,RT(n)) > DV_blue(n,RT(n)) % red wins,
            choice(n) = 1;
            losingDVval(n) = DV_blue(n,RT(n)); % so blue is loser
        else % should only happen when there's no noise! add some.
            keyboard
        end
    end    
    
    totalEvidence(n) = sum(weights(shape(n,1:RT(n))));

    % conf is on a scale of 1-5, inversely related to evidence
    % supporting unchosen option, measured as distance from its bound
    distFromBound(n) = B-losingDVval(n);
    distQuant = [1.3059 1.7640 2.1835 2.7562 inf];
    conf(n) = find(distFromBound(n)<distQuant,1,'first');

end

correct = choice==corrTarg;
pctCorr = sum(correct)/ntrials



%% some plots

% figure;hist(totalEvidence,100);
% figure;hist(RT,20);
% figure;hist(distFromBound,20)
% 
% % create a mapping via simple quantiles of a learned distribution of
% % 'distance from bound'; use this in the loop above after running.
% distQuant = quantile(distFromBound,4)

%% cumulative evidence vs. choice (Kira Fig 2D) and confidence

clear chFreq meanRT meanConf
TEquant = quantile(totalEvidence,28); % e.g. 30 bins
theseTrials = totalEvidence<TEquant(1);
chFreq(1) = mean(choice(theseTrials));
meanRT(1) = mean(RT(theseTrials));
meanConf(1) = mean(conf(theseTrials));
for j = 1:length(TEquant)-1
    theseTrials = totalEvidence>=TEquant(j) & totalEvidence<TEquant(j+1);
    chFreq(j+1) = mean(choice(theseTrials));
    meanRT(j+1) = mean(RT(theseTrials));
    meanConf(j+1) = mean(conf(theseTrials));
end
theseTrials = find(totalEvidence>=TEquant(end));
chFreq(end+1) = mean(choice(theseTrials));
meanRT(end+1) = mean(RT(theseTrials));
meanConf(end+1) = mean(conf(theseTrials));


%%
figure(12); set(gcf,'position',[500   100   400   850]);
TEaxis = TEquant(1:end-1)+diff(TEquant)/2;

% choice
subplot(3,1,1);
plot(TEaxis,chFreq(2:end-1),'o');
% fit logistic
X = totalEvidence;
y = choice;
[beta, ~, stats] = glmfit(X, y, 'binomial');
TEinterp = TEaxis(1):0.01:TEaxis(end);
yVals = glmval(beta,TEinterp,'logit');
hold on; plot(TEinterp,yVals,'r-');
xlabel('Total Evidence (LLR)');
ylabel('Proportion ''red'' choices');
changeAxesFontSize(gca,15,15);

% RT
subplot(3,1,2);
plot(TEaxis,meanRT(2:end-1),'ro-');
xlabel('Total Evidence (LLR)');
ylabel('mean RT (nshapes)');
% ylim([1 5]);
changeAxesFontSize(gca,15,15);

% conf
subplot(3,1,3);
plot(TEaxis,meanConf(2:end-1),'ro-');
xlabel('Total Evidence (LLR)');
ylabel('mean confidence rating (1-5)');
ylim([1 5]);
changeAxesFontSize(gca,15,15);





% % % % temp, testing sample.m:
% % % for n=1:10000
% % %     samp(n) = sample(samplingDist_blue);
% % % end
% % % figure;
% % % histogram(samp,'Normalization','probability');
